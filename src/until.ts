import * as vscode from 'vscode'

export class Util {
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

const mitt= function (n?:any) {
  return {
    all: (n = n || new Map()),
    on: function (t:any, e:any) {
      var i = n.get(t)
      i ? i.push(e) : n.set(t, [e])
    },
    off: function (t:any, e:any) {
      var i = n.get(t)
      i && (e ? i.splice(i.indexOf(e) >>> 0, 1) : n.set(t, []))
    },
    emit: function (t:any, e:any) {
      var i = n.get(t)
      i &&
        i.slice().map(function (n:any) {
          n(e)
        }),
        (i = n.get('*')) &&
          i.slice().map(function (n:any) {
            n(t, e)
          })
    },
  }
}

export const emitter = mitt()

