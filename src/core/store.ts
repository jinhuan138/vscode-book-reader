import * as vscode from 'vscode'

type ContentStore = {
  context: null | vscode.ExtensionContext
  webviews: vscode.Webview[]
  sliderWebview: null | vscode.Webview
}

export const Store: ContentStore = {
  context: null,
  webviews: [],
  sliderWebview: null,
}
