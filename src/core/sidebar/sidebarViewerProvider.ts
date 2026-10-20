import * as vscode from 'vscode'
import { Store } from '../store'
import { createWebviewMessageHandler } from '../webviewMessageHandler'
import { getWebviewHtml } from '../webviewHtml'
import { join } from 'path'

export class SidebarViewerProvider implements vscode.WebviewViewProvider {
  private extensionPath: string
  private context: vscode.ExtensionContext

  constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath
    this.context = context
  }

  private buildLocalResourceRoots(): vscode.Uri[] {
    const roots = [vscode.Uri.file(this.extensionPath), vscode.Uri.file(join(this.context.globalStorageUri.fsPath, 'tts-cache'))]
    const config = vscode.workspace.getConfiguration('book-reader')
    const bookFolderPath = config.get<string>('bookFolderPath')
    if (bookFolderPath) {
      roots.push(vscode.Uri.file(bookFolderPath))
    }
    const workspaceFolders = vscode.workspace.workspaceFolders
    if (workspaceFolders) {
      roots.push(...workspaceFolders.map((f) => f.uri))
    }
    return roots
  }

  private updateLocalResourceRoots(webview: vscode.Webview) {
    const newRoots = this.buildLocalResourceRoots()
    const oldRoots = webview.options.localResourceRoots ?? []

    const rootsMap = new Map<string, vscode.Uri>()
    for (const uri of [...oldRoots, ...newRoots]) {
      rootsMap.set(uri.toString(), uri)
    }

    webview.options = {
      enableScripts: true,
      localResourceRoots: Array.from(rootsMap.values()),
    }
  }
  resolveWebviewView(webviewView: vscode.WebviewView) {
    Store.sliderWebview = webviewView
    const webview = webviewView.webview
    const messages = createWebviewMessageHandler(webview, this.context, () => webviewView.title ?? '')
    this.updateLocalResourceRoots(webview)
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('book-reader.bookFolderPath')) {
        this.updateLocalResourceRoots(webview)
      }
    })
    webview.onDidReceiveMessage(async (message) => {
      if (messages.handleMessage(message)) return
      switch (message.type) {
        case 'init':
          messages.stop()
          webview.postMessage({
            type: 'isSidebar',
            content: true,
          })
          webview.postMessage({
            type: 'codeDisguise',
            content: this.context.globalState.get<boolean>(
              'codeDisguise',
              vscode.workspace.getConfiguration('book-reader').get<boolean>('codeDisguise', false),
            ),
          })
          webview.postMessage({
            type: 'alwaysDisguiseTabTitle',
            content: this.context.globalState.get<boolean>(
              'alwaysDisguiseTabTitle',
              vscode.workspace.getConfiguration('book-reader').get<boolean>('alwaysDisguiseTabTitle', false),
            ),
          })
          break
        case 'title':
          webviewView.title = message.content
          break
      }
    })
    webviewView.onDidDispose(() => messages.dispose())
    webviewView.webview.html = getWebviewHtml(webview, this.extensionPath)
  }
}
