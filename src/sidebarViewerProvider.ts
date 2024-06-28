import * as vscode from 'vscode'
import { readFileSync } from 'fs'

class Util {
  public static buildPath(
    data: string,
    webview: vscode.Webview,
    contextPath: string,
  ): string {
    return data
      .replace(/((src|href)=("|')?)(\/\/)/gi, '$1http://')
      .replace(
        /((src|href)=("|'))((?!(http))[^"']+?\.(css|js|properties|json|png|jpg))\b/gi,
        '$1' + webview.asWebviewUri(vscode.Uri.file(`${contextPath}`)) + '/$4',
      )
  }

  public static listen(
    webviewPanel: vscode.WebviewPanel,
    uri: vscode.Uri,
    callback: () => void,
    disposeCallback?: () => void,
  ) {
    const changeDocumentSubscription = vscode.workspace.onDidChangeTextDocument(
      (e) => {
        if (e.document.uri.toString() === uri.toString()) {
          callback()
        }
      },
    )
    webviewPanel.onDidDispose(() => {
      changeDocumentSubscription.dispose()
    })
  }
}

export class SidebarViewerProvider implements vscode.WebviewViewProvider {
  private extensionPath: string
  constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath
  }
  resolveWebviewView(webviewView: vscode.WebviewView) {
    const webview = webviewView.webview
    webview.options = {
      enableScripts: true,
    }
    webview.onDidReceiveMessage(async () =>
    webview.postMessage({
      type: "open",
      // content: url,
    })
  );
    webviewView.webview.html = Util.buildPath(
      readFileSync(this.extensionPath + '/resource/dist/index.html', 'utf8'),
      webview,
      this.extensionPath + '/resource/dist',
    )
  }
}
