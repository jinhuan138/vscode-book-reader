import * as vscode from 'vscode'

type ContentStore = {
  context: null | vscode.ExtensionContext
  webviewMap: Map<string, vscode.WebviewPanel>
  sliderWebview: null | vscode.Webview
}

export const Store: ContentStore = {
  context: null,
  webviewMap: new Map(),
  sliderWebview: null,
}
