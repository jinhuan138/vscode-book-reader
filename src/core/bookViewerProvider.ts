import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { resolve, join } from 'path'
import { homedir } from 'os'
import { translate } from 'bing-translate-api'

export class BookViewerProvider implements vscode.CustomReadonlyEditorProvider {
  private extensionPath: string

  constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath
  }

  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
    return { uri, dispose: (): void => {} }
  }

  public resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
  ): void | Thenable<void> {
    const webview = webviewPanel.webview
    const uri = document.uri
    const folderPath = vscode.Uri.file(resolve(uri.fsPath, '..'))
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(this.extensionPath), folderPath],
    }
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'init':
          if (typeof document === 'string') {
            webview.postMessage({
              type: 'openBook',
              content: document,
            })
          } else {
            webview.postMessage({
              type: 'open',
              content: webview.asWebviewUri(document.uri).toString(),
            })
            // this.emitter.emit('open', webview.asWebviewUri(document.uri).toString())
          }

          break
        case 'style':
          // this.emitter.emit('style', message.content)
          break
        case 'flow':
          // this.emitter.emit('flow', message.content)
          break
        case 'animation':
          // this.emitter.emit('animation', message.content)
          break
        case 'download':
          const filePath = vscode.Uri.file(join(homedir(), '.bookReader', Date.now() + '.jpg'))
          await vscode.workspace.fs.writeFile(filePath, message.content)
          vscode.commands.executeCommand('vscode.open', filePath, {
            forceNewWindow: true,
          })
        case 'title':
          webviewPanel.title = message.content
          break
        case 'disguise':
          // this.emitter.emit('disguise', message.content)
          break
        case 'translate':
          translate(message.content, null, message.to)
            .then((res) => {
              webview.postMessage({
                type: 'translate',
                content: res!.translation,
              })
            })
            .catch((err) => {
              console.error(err)
              webview.postMessage({
                type: 'translate',
                content: 'translate error',
              })
            })
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
    webview.html = readFileSync(this.extensionPath + '/resource/dist/index.html', 'utf8')
  }
}
