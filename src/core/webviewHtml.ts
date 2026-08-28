import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { join } from 'path'

// webview 只接受一段 html 字符串，构建产物中的相对资源路径需替换为 webview 可访问的地址
export function getWebviewHtml(webview: vscode.Webview, extensionPath: string): string {
  const distPath = join(extensionPath, 'renderer', 'dist')
  const baseUri = webview.asWebviewUri(vscode.Uri.file(distPath)).toString().replace(/\/$/, '')
  const html = readFileSync(join(distPath, 'index.html'), 'utf8')
  return html.replace(
    /(src|href)="\.?\/?(assets\/[^"]+)"/g,
    (_match, attr: string, file: string) => `${attr}="${baseUri}/${file}"`,
  )
}
