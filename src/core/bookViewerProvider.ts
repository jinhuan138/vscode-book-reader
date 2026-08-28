import * as vscode from 'vscode'
import { SidebarBookListProvider } from './sidebar/sidebarBookListProvider'
import { dirname, join } from 'path'
import { translate as bingTranslate } from 'bing-translate-api'
import { Store } from '../core/store'
import { generateEdgeTTS, clearTTSCache } from './ttsPlayer'
import { getWebviewHtml } from './webviewHtml'

const MAX_TRANSLATION_TEXT_LENGTH = 10000
const TRANSLATION_CHUNK_LENGTH = 900

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
      ? preferredBoundary
      : TRANSLATION_CHUNK_LENGTH
    const chunk = remaining.slice(0, splitAt).trim()
    if (chunk) chunks.push(chunk)
    remaining = remaining.slice(splitAt).trimStart()
  }

  if (remaining) chunks.push(remaining)
  return chunks
}

const translateText = async (text: string, to: string) => {
  const translations: string[] = []
  let detectedSource = ''

  for (const chunk of splitTranslationText(text)) {
    const result = await bingTranslate(chunk, null, to)
    if (!result?.translation) {
      throw new Error('Translation service returned an empty result')
    }
    translations.push(result.translation)
    detectedSource ||= result.language?.from || ''
  }

  return {
    content: translations.join('\n'),
    from: detectedSource,
  }
}

export class BookViewerProvider implements vscode.CustomReadonlyEditorProvider {
  private _context: vscode.ExtensionContext
  private title: string = ''
  constructor(context: vscode.ExtensionContext) {
    this._context = context
  }

  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
    return { uri, dispose: (): void => {} }
  }

  public updateSliderWebview(type: string, content: any) {
    const webview = Store.sliderWebview!.webview
    webview!.postMessage({
      type,
      content,
    })
  }

  public resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
  ): void | Thenable<void> {
    this.createBookPanel(document.uri, webviewPanel)
  }

  public createBookPanel(uri: vscode.Uri, webviewPanel: vscode.WebviewPanel) {
    const webview = webviewPanel.webview
    if (!Store.webviewMap.has(uri.toString())) {
      Store.webviewMap.set(uri.toString(), webviewPanel)
    }
    webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.file(this._context.extensionPath),
        vscode.Uri.file(dirname(uri.fsPath)),
        vscode.Uri.file(join(this._context.globalStorageUri.fsPath, 'tts-cache')),
      ],
    }
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'init':
          webview.postMessage({
            type: 'openBook',
            content: webview.asWebviewUri(uri).toString(),
          })
          break
        case 'style':
          this._context.globalState.update('style', message.content)
          this.updateSliderWebview(message.type, message.content)
          break
        case 'flow':
          this._context.globalState.update('flow', message.content)
          this.updateSliderWebview(message.type, message.content)
          break
        case 'animation':
          this._context.globalState.update('animation', message.content)
          this.updateSliderWebview(message.type, message.content)
          break
        case 'title':
          webviewPanel.title = message.content
          this.title = message.content
          break
        case 'download':
          const imgName = `${this.title}${Date.now()}.jpg`
          const workspaceFolders = vscode.workspace.workspaceFolders
          if (!workspaceFolders || workspaceFolders.length === 0) {
            // 如果没有工作区，让用户选择保存位置
            const uri = await vscode.window.showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Select Img Save Folder',
            })

            if (uri) {
              const filePath = vscode.Uri.joinPath(uri[0], imgName)
              await vscode.workspace.fs.writeFile(filePath, message.content)
              // 打开文件
              vscode.commands.executeCommand('vscode.open', imgName, {
                forceNewWindow: true,
              })
            }
          } else {
            // 保存到工作区根目录
            const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, imgName)
            await vscode.workspace.fs.writeFile(filePath, message.content)
            // 打开文件
            vscode.commands.executeCommand('vscode.open', filePath, {
              forceNewWindow: true,
            })
          }
          break
        case 'translate': {
          const requestId = message.requestId
          const content = typeof message.content === 'string' ? message.content.trim() : ''
          const to = typeof message.to === 'string' ? message.to : ''
          const respondWithError = (error: string) => webview.postMessage({
            type: 'translate',
            requestId,
            error,
          })

          if (!content || !to || !/^[A-Za-z-]{2,20}$/.test(to)) {
            await respondWithError('INVALID_INPUT')
            break
          }
          if (content.length > MAX_TRANSLATION_TEXT_LENGTH) {
            await respondWithError('TEXT_TOO_LONG')
            break
          }

          try {
            const result = await translateText(content, to)
            await webview.postMessage({
              type: 'translate',
              requestId,
              ...result,
            })
          } catch (err) {
            console.error('Translation failed', err)
            await respondWithError('TRANSLATE_FAILED')
          }
          break
        }
        case 'codeDisguise':
          this._context.globalState.update('codeDisguise', message.content)
          this.updateSliderWebview(message.type, message.content)
          vscode.workspace
            .getConfiguration('book-reader')
            .update('codeDisguise', message.content, vscode.ConfigurationTarget.Global)
          break
        case 'sidebarDisguise':
          vscode.workspace
            .getConfiguration('book-reader')
            .update('sidebarDisguise', message.content, vscode.ConfigurationTarget.Global)
          if (!message.content) {
            SidebarBookListProvider.getInstance().setDisguised(false)
          }
          break
        case 'ttsConfig':
          this._context.globalState.update('ttsConfig', message.content)
          this.updateSliderWebview(message.type, message.content)
          break
        case 'ttsSpeak': {
          const { id, text, voice, speed } = message.content
          generateEdgeTTS(id, text, voice, speed || 1).then(({ filePath, error }) => {
            if (filePath) {
              const url = webview.asWebviewUri(vscode.Uri.file(filePath)).toString()
              webview.postMessage({ type: 'ttsAudio', id, content: url })
            } else {
              webview.postMessage({ type: 'ttsEnd', id, error })
            }
          })
          break
        }
        case 'ttsStop':
          clearTTSCache()
          break
      }
    })
    // 当面板失去焦点的时候，使用伪装代码
    webviewPanel.onDidChangeViewState((e) => {
      webview.postMessage({
        type: 'active',
        content: e.webviewPanel.active,
      })
    })
    // 当面板关闭/销毁，从列表中移除
    webviewPanel.onDidDispose(() => {
      Store.webviewMap.delete(uri.toString())
    })
    webview.html = getWebviewHtml(webview, this._context.extensionPath)
  }
}
