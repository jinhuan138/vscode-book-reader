import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { dirname } from 'path'
import { translate } from 'bing-translate-api'
import { Store } from '../core/store'

export class BookViewerProvider implements vscode.CustomReadonlyEditorProvider {
  private _context: vscode.ExtensionContext
  private title: string = ''
  constructor(context: vscode.ExtensionContext) {
    this._context = context
  }

  public openCustomDocument(uri: vscode.Uri): vscode.CustomDocument | Thenable<vscode.CustomDocument> {
    return { uri, dispose: (): void => {} }
  }

  public updateSliderWebview(type: string, content: any) {
    const webview = Store.sliderWebview!.webview
    webview!.postMessage({
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
    if (!Store.webviewMap.has(uri.toString())) {
      Store.webviewMap.set(uri.toString(), webviewPanel)
    }
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.file(this._context.extensionPath),vscode.Uri.file(dirname(uri.fsPath))],
    }
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'init':
          webview.postMessage({
            type: 'openBook',
            content: webview.asWebviewUri(uri).toString(),
          })
          break
        case 'style':
          this._context.globalState.update('style', message.content)
          this.updateSliderWebview(message.type, message.content)
          break
        case 'flow':
          this._context.globalState.update('flow', message.content)
          this.updateSliderWebview(message.type, message.content)
          break
        case 'animation':
          this._context.globalState.update('animation', message.content)
          this.updateSliderWebview(message.type, message.content)
          break
        case 'title':
          webviewPanel.title = message.content
          this.title = message.content
          break
        case 'download':
          const imgName = `${this.title}${Date.now()}.jpg`
          const workspaceFolders = vscode.workspace.workspaceFolders
          if (!workspaceFolders || workspaceFolders.length === 0) {
            // 如果没有工作区，让用户选择保存位置
            const uri = await vscode.window.showOpenDialog({
              canSelectFiles: false,
              canSelectFolders: true,
              canSelectMany: false,
              openLabel: 'Select Img Save Folder',
            })

            if (uri) {
              const filePath = vscode.Uri.joinPath(uri[0], imgName)
              await vscode.workspace.fs.writeFile(filePath, message.content)
              // 打开文件
              vscode.commands.executeCommand('vscode.open', imgName, {
                forceNewWindow: true,
              })
            }
          } else {
            // 保存到工作区根目录
            const filePath = vscode.Uri.joinPath(workspaceFolders[0].uri, imgName)
            await vscode.workspace.fs.writeFile(filePath, message.content)
            // 打开文件
            vscode.commands.executeCommand('vscode.open', filePath, {
              forceNewWindow: true,
            })
          }
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
    // 当面板关闭/销毁，从列表中移除
    webviewPanel.onDidDispose(() => {
      Store.webviewMap.delete(uri.toString())
    })
    webview.html = readFileSync(this._context.extensionPath + '/renderer/dist/index.html', 'utf8')
  }
}
