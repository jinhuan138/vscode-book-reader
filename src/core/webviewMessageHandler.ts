import * as vscode from 'vscode'
import { translate as bingTranslate } from 'bing-translate-api'
import { createTTSHandler } from './ttsPlayer'

const MAX_TRANSLATION_TEXT_LENGTH = 10000
const TRANSLATION_CHUNK_LENGTH = 900
const configTypes = {
  style: 'string',
  flow: 'string',
  animation: 'boolean',
  codeDisguise: 'boolean',
  alwaysDisguiseTabTitle: 'boolean',
  ttsConfig: 'string',
} as const

// Serialize writes across webviews so older saves cannot overwrite newer saves.
let configQueue = Promise.resolve()

const splitTranslationText = (text: string) => {
  const chunks: string[] = []
  let remaining = text.trim()
  while (remaining.length > TRANSLATION_CHUNK_LENGTH) {
    const candidate = remaining.slice(0, TRANSLATION_CHUNK_LENGTH)
    const boundaries = [
      candidate.lastIndexOf('\n') + 1,
      candidate.lastIndexOf('。') + 1,
      candidate.lastIndexOf('！') + 1,
      candidate.lastIndexOf('？') + 1,
      candidate.lastIndexOf('. ') + 1,
      candidate.lastIndexOf('! ') + 1,
      candidate.lastIndexOf('? ') + 1,
      candidate.lastIndexOf('; ') + 1,
      candidate.lastIndexOf(' '),
    ]
    const preferredBoundary = Math.max(...boundaries)
    const splitAt = preferredBoundary >= TRANSLATION_CHUNK_LENGTH / 2
      ? preferredBoundary : TRANSLATION_CHUNK_LENGTH
    const chunk = remaining.slice(0, splitAt).trim()
    if (chunk) chunks.push(chunk)
    remaining = remaining.slice(splitAt).trimStart()
  }
  if (remaining) chunks.push(remaining)
  return chunks
}

const translateText = async (params: any, signal: AbortSignal) => {
  const text = typeof params?.text === 'string' ? params.text.trim() : ''
  const to = params?.to
  if (!text || typeof to !== 'string' || !/^[A-Za-z-]{2,20}$/.test(to)) throw new Error('INVALID_INPUT')
  if (text.length > MAX_TRANSLATION_TEXT_LENGTH) throw new Error('TEXT_TOO_LONG')

  const translations: string[] = []
  let from = ''
  for (const chunk of splitTranslationText(text)) {
    signal.throwIfAborted()
    const result = await bingTranslate(chunk, null, to)
    signal.throwIfAborted()
    if (!result?.translation) throw new Error('TRANSLATE_FAILED')
    translations.push(result.translation)
    from ||= result.language?.from || ''
  }
  return { content: translations.join('\n'), from }
}

export function createWebviewMessageHandler(
  webview: vscode.Webview,
  context: vscode.ExtensionContext,
  getTitle: () => string,
  syncConfig?: (key: string, value: string | boolean) => void,
) {
  const tts = createTTSHandler(webview)
  const requests = new Map<string, AbortController>()
  let disposed = false

  const saveConfig = (params: any, signal: AbortSignal) => {
    const { key, value } = params ?? {}
    if (!Object.hasOwn(configTypes, key) || typeof value !== configTypes[key as keyof typeof configTypes] ||
      (key === 'flow' && value !== 'paginated' && value !== 'scrolled')) {
      throw new Error('Invalid configuration')
    }
    const save = configQueue.then(async () => {
      signal.throwIfAborted()
      if (key === 'codeDisguise' || key === 'alwaysDisguiseTabTitle') {
        const config = vscode.workspace.getConfiguration('book-reader')
        if (config.get(key) !== value) await config.update(key, value, vscode.ConfigurationTarget.Global)
      }
      await context.globalState.update(key, value)
      syncConfig?.(key, value)
    })
    configQueue = save.catch(() => {})
    return save
  }

  const download = async (params: any, signal: AbortSignal) => {
    const data = params?.data
    if (!Array.isArray(data) || !data.length || data.some((byte) => !Number.isInteger(byte) || byte < 0 || byte > 255)) {
      throw new Error('Invalid image data')
    }
    let folder = vscode.workspace.workspaceFolders?.[0]?.uri
    if (!folder) {
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Img Save Folder',
      })
      signal.throwIfAborted()
      folder = selected?.[0]
      if (!folder) return { cancelled: true } as const
    }
    signal.throwIfAborted()
    const title = getTitle().replace(/[<>:"/\\|?*\x00-\x1f]/g, '_')
    const filePath = vscode.Uri.joinPath(folder, `${title}${Date.now()}.jpg`)
    await vscode.workspace.fs.writeFile(filePath, Uint8Array.from(data))
    signal.throwIfAborted()
    await vscode.commands.executeCommand('vscode.open', filePath, { forceNewWindow: true })
    return { cancelled: false, uri: filePath.toString() } as const
  }

  const respond = async (id: string, result?: unknown, error?: { name: string; message: string }) => {
    if (disposed) return
    try { await webview.postMessage({ type: 'invokeResult', id, result, error }) } catch { /* webview closed */ }
  }
  const invoke = async (message: any, controller: AbortController) => {
    const { id, method, params } = message
    try {
      let result: unknown
      switch (method) {
        case 'translate': result = await translateText(params, controller.signal); break
        case 'download': result = await download(params, controller.signal); break
        case 'saveConfig': result = await saveConfig(params, controller.signal); break
        default: throw new Error('Unknown invoke method')
      }
      controller.signal.throwIfAborted()
      await respond(id, result)
    } catch (error) {
      await respond(id, undefined, {
        name: error instanceof Error ? error.name : 'Error',
        message: error instanceof Error ? error.message : String(error),
      })
    } finally {
      requests.delete(id)
    }
  }

  return {
    stop: tts.stop,
    handleMessage(message: any): boolean {
      if (disposed) return true
      if (tts.handleMessage(message)) return true
      if (message?.type === 'cancelInvoke') {
        requests.get(message.id)?.abort()
        return true
      }
      if (message?.type !== 'invoke' || typeof message.id !== 'string') return false
      if (!requests.has(message.id)) {
        const controller = new AbortController()
        requests.set(message.id, controller)
        void invoke(message, controller)
      }
      return true
    },
    dispose() {
      disposed = true
      tts.dispose()
      for (const controller of requests.values()) controller.abort()
      requests.clear()
    },
  }
}
