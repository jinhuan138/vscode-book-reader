import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { Store } from '../store'

export class SidebarViewerProvider implements vscode.WebviewViewProvider {
  private extensionPath: string
  constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath
  }
  resolveWebviewView(webviewView: vscode.WebviewView) {
    const webview = webviewView.webview
    Store.sliderWebview = webview
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(this.extensionPath)],
    }
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'init':
          webview.postMessage({
            type: 'isSidebar',
            content: 'true',
          })
          break
        case 'title':
          webviewView.title = message.content
          break
        case 'download':
          const filePath = vscode.Uri.file(join(homedir(), '.bookReader', Date.now() + '.jpg'))
          await vscode.workspace.fs.writeFile(filePath, message.content)
          vscode.commands.executeCommand('vscode.open', filePath, {
            forceNewWindow: true,
          })
          break
      }
    })
    webviewView.webview.html = readFileSync(this.extensionPath + '/resource/dist/index.html', 'utf8')
  }
}
