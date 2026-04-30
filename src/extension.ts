import * as vscode from 'vscode'
import { BookViewerProvider } from './core/bookViewerProvider'
import { SidebarViewerProvider } from './core/sidebar/sidebarViewerProvider'
import { sidebarBookListProvider } from './core/sidebar/sidebarBookListProvider'

//https://rackar.github.io/vscode-ext-doccn
//https://code.visualstudio.com/api
//https://juejin.cn/post/7208370120850079799#heading-31
//https://github.com/aooiuu/any-reader.git
//https://github.com/cteamx/Thief-Book-VSCode
export function activate(context: vscode.ExtensionContext) {
  const option = {
    webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true },
  }
  // 注册自定义编辑器
  vscode.window.registerCustomEditorProvider('bookReader', new BookViewerProvider(context), option)
  // 注册侧边栏
  vscode.window.registerWebviewViewProvider('bookReaderSidebar', new SidebarViewerProvider(context), option)
  // const disposable = vscode.commands.registerCommand('bookReader.openBook', async (bookId: string) => {
  //   const panel = vscode.window.createWebviewPanel('bookReaderPanel', 'Book Reader', vscode.ViewColumn.Beside)
  //   new BookViewerProvider(context).resolveCustomEditor(bookId, panel)
  // })
  // context.subscriptions.push(disposable)
  // 侧边栏书籍列表
  vscode.window.createTreeView('bookList', {
    treeDataProvider: new sidebarBookListProvider(),
    showCollapseAll: false,
  })
}
