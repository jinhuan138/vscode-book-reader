import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { Util } from './until'

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
    webview.onDidReceiveMessage(
      async () =>
        webview.postMessage({
          type: 'open',
          content: webview.asWebviewUri(uri).toString(),
        }),
      this.emitter.emit('open', webview.asWebviewUri(uri).toString()),
    )
    webview.html = Util.buildPath(
      readFileSync(this.extensionPath + '/resource/dist/index.html', 'utf8'),
      webview,
      this.extensionPath + '/resource/dist',
    )
  }
}
