import { ElMessage } from 'element-plus'
import { nextTick } from 'vue'

type ConfigValues = {
  style: string
  flow: 'paginated' | 'scrolled'
  animation: boolean
  codeDisguise: boolean
  alwaysDisguiseTabTitle: boolean
  ttsConfig: string
}

type VSCodeApi = {
  postMessage: (message: any) => void
  getState(): any
  setState(state: any): void
}

type InvokeMethods = {
  translate: {
    params: { text: string; to: string }
    result: { content: string; from: string }
  }
  download: {
    params: { data: number[] }
    result: { cancelled: true } | { cancelled: false; uri: string }
  }
  saveConfig: {
    params: { key: keyof ConfigValues; value: ConfigValues[keyof ConfigValues] }
    result: void
  }
  ttsSpeak: {
    params: { text: string; voice: string; speed: number }
    result: string
  }
}

type InvokeOptions = { signal?: AbortSignal; timeout?: number }
type PendingRequest = { resolve(value: unknown): void; reject(error: Error): void }
type VSCode = VSCodeApi & {
  invoke<K extends keyof InvokeMethods>(
    method: K,
    params: InvokeMethods[K]['params'],
    options?: InvokeOptions,
  ): Promise<InvokeMethods[K]['result']>
}

const createBridge = (api: VSCodeApi): VSCode => {
  const pending = new Map<string, PendingRequest>()

  window.addEventListener('message', ({ data }: MessageEvent) => {
    if (data?.type !== 'invokeResult' || typeof data.id !== 'string') return
    const request = pending.get(data.id)
    if (!request) return
    if (data.error) {
      const error = new Error(data.error.message || 'Request failed')
      error.name = data.error.name || 'Error'
      request.reject(error)
    } else {
      request.resolve(data.result)
    }
  })

  window.addEventListener('pagehide', () => {
    for (const request of pending.values()) {
      request.reject(new DOMException('Webview closed', 'AbortError'))
    }
  })

  return {
    postMessage: (message) => api.postMessage(message),
    getState: () => api.getState(),
    setState: (state) => api.setState(state),
    invoke(method, params, { signal, timeout = 45000 } = {}) {
      return new Promise((resolve, reject) => {
        if (signal?.aborted) {
          reject(new DOMException('Request cancelled', 'AbortError'))
          return
        }
        if (!Number.isFinite(timeout) || timeout <= 0) {
          reject(new RangeError('Request timeout must be positive'))
          return
        }

        const id = crypto.randomUUID()
        let timer: ReturnType<typeof setTimeout>
        const settle = (error: Error | null, value?: unknown) => {
          if (!pending.delete(id)) return
          clearTimeout(timer)
          signal?.removeEventListener('abort', abort)
          if (error) {
            // Discard late results and stop any remaining host-side work.
            try { api.postMessage({ type: 'cancelInvoke', id }) } catch { /* webview is closing */ }
            reject(error)
          } else {
            resolve(value as InvokeMethods[typeof method]['result'])
          }
        }
        const abort = () => settle(new DOMException('Request cancelled', 'AbortError'))
        pending.set(id, {
          resolve: (value) => settle(null, value),
          reject: (error) => settle(error),
        })
        signal?.addEventListener('abort', abort, { once: true })
        timer = setTimeout(() => settle(new DOMException('Request timed out', 'TimeoutError')), timeout)

        try {
          api.postMessage({ type: 'invoke', id, method, params })
        } catch (error) {
          settle(error instanceof Error ? error : new Error(String(error)))
        }
      })
    },
  }
}

let vscode: VSCode | null = null
const syncingConfigs = new Map<string, symbol>()

export function applyConfigUpdate(key: string, update: () => void): void {
  const token = Symbol()
  syncingConfigs.set(key, token)
  try {
    update()
  } finally {
    // Vue watchers finish before the next tick; synchronized values must not be saved back.
    void nextTick(() => {
      if (syncingConfigs.get(key) === token) syncingConfigs.delete(key)
    })
  }
}

export default function useVscode(): VSCode | null {
  const acquireVsCodeApi = (window as any).acquireVsCodeApi
  if (!vscode && typeof acquireVsCodeApi != 'undefined') {
    vscode = createBridge(acquireVsCodeApi())
  }
  return vscode
}

export async function saveConfig<K extends keyof ConfigValues>(key: K, value: ConfigValues[K]): Promise<void> {
  if (syncingConfigs.has(key)) return
  try {
    await useVscode()?.invoke('saveConfig', { key, value })
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') return
    console.error('Failed to save configuration:', error)
    ElMessage.error(error instanceof Error ? error.message : String(error))
  }
}
