import * as vscode from 'vscode'
import { dirname, join } from 'path'
import { Store } from '../core/store'
import { createWebviewMessageHandler } from './webviewMessageHandler'
import { getWebviewHtml } from './webviewHtml'

export class BookViewerProvider implements vscode.CustomReadonlyEditorProvider {
  private _context: vscode.ExtensionContext
  constructor(context: vscode.ExtensionContext) {
    this._context = context
  }

  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
    return { uri, dispose: (): void => {} }
  }

  public updateSliderWebview(type: string, content: any) {
    Store.sliderWebview?.webview.postMessage({
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
    const messages = createWebviewMessageHandler(
      webview,
      this._context,
      () => webviewPanel.title,
      (key, value) => this.updateSliderWebview(key, value),
    )
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
      if (messages.handleMessage(message)) return
      switch (message.type) {
        case 'init':
          messages.stop()
          webview.postMessage({
            type: 'openBook',
            content: webview.asWebviewUri(uri).toString(),
          })
          webview.postMessage({
            type: 'codeDisguise',
            content: this._context.globalState.get<boolean>(
              'codeDisguise',
              vscode.workspace.getConfiguration('book-reader').get<boolean>('codeDisguise', false),
            ),
          })
          webview.postMessage({
            type: 'alwaysDisguiseTabTitle',
            content: this._context.globalState.get<boolean>(
              'alwaysDisguiseTabTitle',
              vscode.workspace.getConfiguration('book-reader').get<boolean>('alwaysDisguiseTabTitle', false),
            ),
          })
          break
        case 'title':
          webviewPanel.title = message.content
          break
      }
    })
    // 当面板关闭/销毁，从列表中移除
    webviewPanel.onDidDispose(() => {
      messages.dispose()
      Store.webviewMap.delete(uri.toString())
    })
    webview.html = getWebviewHtml(webview, this._context.extensionPath)
  }
}
