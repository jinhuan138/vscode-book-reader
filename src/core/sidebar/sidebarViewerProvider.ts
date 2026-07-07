import * as vscode from 'vscode'
import { readFileSync } from 'fs'
import { Store } from '../store'

export class SidebarViewerProvider implements vscode.WebviewViewProvider {
  private extensionPath: string
  private title: string = ''
  constructor(context: vscode.ExtensionContext) {
    this.extensionPath = context.extensionPath
  }

  private buildLocalResourceRoots(): vscode.Uri[] {
    const roots = [vscode.Uri.file(this.extensionPath)]
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
    this.updateLocalResourceRoots(webview)
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('book-reader.bookFolderPath')) {
        this.updateLocalResourceRoots(webview)
      }
    })
    let hasFocused = false
    vscode.window.onDidChangeActiveTextEditor(() => {
      if (hasFocused) {
        webview.postMessage({ type: 'active', content: false })
      }
    })
    webview.onDidReceiveMessage(async (message) => {
      switch (message.type) {
        case 'init':
          webview.postMessage({
            type: 'isSidebar',
            content: true,
          })
          webview.postMessage({
            type: 'sidebarDisguise',
            content: vscode.workspace.getConfiguration('book-reader').get<boolean>('sidebarDisguise', false),
          })
          break
        case 'title':
          webviewView.title = message.content
          if (message.content) {
            webview.postMessage({ type: 'active', content: true })
          }
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
        case 'focused':
          hasFocused = true
          break
        case 'sidebarDisguise':
          vscode.workspace
            .getConfiguration('book-reader')
            .update('sidebarDisguise', message.content, vscode.ConfigurationTarget.Global)
          break
      }
    })
    webviewView.webview.html = readFileSync(this.extensionPath + '/renderer/dist/index.html', 'utf8')
  }
}
