import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { join } from 'path'
import { Util } from './until'
import { homedir } from 'os'

export class SidebarViewerProvider implements vscode.WebviewViewProvider {
  private extensionPath: string
  private emitter: any
  constructor(context: vscode.ExtensionContext, _emitter: any) {
    this.extensionPath = context.extensionPath
    this.emitter = _emitter
  }
  resolveWebviewView(webviewView: vscode.WebviewView) {
    const webview = webviewView.webview
    webview.options = {
      enableScripts: true,
    }
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'init':
          webview.postMessage({
            type: 'type',
            content: 'sidebar',
          })
          break
        case 'title':
          webviewView.title = message.content
          break
        case 'download':
          const filePath = vscode.Uri.file(
            join(homedir(), '.bookReader', Date.now() + '.jpg'),
          )
          await vscode.workspace.fs.writeFile(filePath, message.content)
          vscode.commands.executeCommand('vscode.open', filePath, {
            forceNewWindow: true,
          })
          break
      }
    })
    this.emitter.on('open', (url: string) => {
      webview.postMessage({
        type: 'open',
        content: url,
      })
    })
    this.emitter.on('style', (theme: any) => {
      webview.postMessage({
        type: 'style',
        content: theme,
      })
    })
    this.emitter.on('flow', (type: any) => {
      webview.postMessage({
        type: 'flow',
        content: type,
      })
    })
    webviewView.webview.html = Util.buildPath(
      readFileSync(this.extensionPath + '/resource/dist/index.html', 'utf8'),
      webview,
      this.extensionPath + '/resource/dist',
    )
  }
}
