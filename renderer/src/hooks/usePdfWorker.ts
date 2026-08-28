import * as pdfjsLib from 'pdfjs-dist'

// VS Code webview 的文档源是 vscode-webview://，而 asWebviewUri 生成的资源在 vscode-cdn.net 上，
// 两者不同源。pdf.js 对跨源 workerSrc 会包一层内容为 `await import(跨源URL)` 的 blob worker，
// 但该 fetch 在 webview 里既不成功也不失败，要干等 30 秒才抛错并回退到主线程解析。
// 这里把 worker 脚本取回本地生成同源 blob，再经 workerPort 直接交给 pdf.js，绕开 origin 检查。
const workerUrl = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString()

let blobUrlPromise: Promise<string> | null = null
let worker: Worker | null = null

const getWorkerBlobUrl = () => {
  blobUrlPromise ??= fetch(workerUrl)
    .then((response) => {
      if (!response.ok) throw new Error(`Failed to load pdf worker: ${response.status}`)
      return response.blob()
    })
    .then((blob) => URL.createObjectURL(blob))
    .catch((error) => {
      blobUrlPromise = null
      throw error
    })
  return blobUrlPromise
}

// 每次开书都换一个干净的 worker：pdf.js 不允许同一个 port 上存在两个存活的 PDFWorker
export const preparePdfWorker = async () => {
  const blobUrl = await getWorkerBlobUrl()
  worker?.terminate()
  worker = new Worker(blobUrl, { type: 'module' })
  pdfjsLib.GlobalWorkerOptions.workerPort = worker
}
