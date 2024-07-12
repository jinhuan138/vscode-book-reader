import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { Util } from './until'

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
      if (message.type === 'init') {
        webview.postMessage({
          type: 'type',
          content: 'sidebar',
        })
      }
    })
    this.emitter.on('open', (url: string) => {
      webview.postMessage({
        type: 'open',
        content: url,
      })
    })
    this.emitter.on('style', (theme:any) => {
      webview.postMessage({
        type: 'style',
        content: theme,
      })
    })
    webviewView.webview.html = Util.buildPath(
      readFileSync(this.extensionPath + '/resource/dist/index.html', 'utf8'),
      webview,
      this.extensionPath + '/resource/dist',
    )
  }
}
