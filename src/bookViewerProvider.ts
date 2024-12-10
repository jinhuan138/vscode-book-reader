import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { resolve, join } from 'path'
import { Util } from './until'
import { homedir } from 'os'

export class BookViewerProvider implements vscode.CustomReadonlyEditorProvider {
  private extensionPath: string
  private emitter: any

  constructor(context: vscode.ExtensionContext, _emitter: any) {
    this.extensionPath = context.extensionPath
    this.emitter = _emitter
  }

  public openCustomDocument(
    uri: vscode.Uri,
    openContext: vscode.CustomDocumentOpenContext,
  ): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
    return { uri, dispose: (): void => {} }
  }

  public resolveCustomEditor(
    document: vscode.CustomDocument,
    webviewPanel: vscode.WebviewPanel,
  ): void | Thenable<void> {
    const uri = document.uri
    const webview = webviewPanel.webview
    const folderPath = vscode.Uri.file(resolve(uri.fsPath, '..'))
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(this.extensionPath), folderPath],
    }
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'init':
          webview.postMessage({
            type: 'open',
            content: webview.asWebviewUri(uri).toString(),
          })
          this.emitter.emit('open', webview.asWebviewUri(uri).toString())
          break
        case 'style':
          this.emitter.emit('style', message.content)
          break
        case 'flow':
          this.emitter.emit('flow', message.content)
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
    webview.html = Util.buildPath(
      readFileSync(this.extensionPath + '/resource/dist/index.html', 'utf8'),
      webview,
      this.extensionPath + '/resource/dist',
    )
  }
}
