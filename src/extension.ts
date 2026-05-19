import * as vscode from 'vscode'
import { BookViewerProvider } from './core/bookViewerProvider'
import { SidebarViewerProvider } from './core/sidebar/sidebarViewerProvider'
import { SidebarBookListProvider, type Book, type TreeItem } from './core/sidebar/sidebarBookListProvider'
import { Store } from './core/store'

//https://rackar.github.io/vscode-ext-doccn
//https://code.visualstudio.com/api
//https://juejin.cn/post/7208370120850079799#heading-31
//https://github.com/aooiuu/any-reader.git
//https://github.com/cteamx/Thief-Book-VSCode
export function activate(context: vscode.ExtensionContext) {
  console.log('🐟book reader🐟 已激活！')
  Store.context = context // 保存上下文到全局 Store
  const option = {
    webviewOptions: { retainContextWhenHidden: true, enableFindWidget: true },
  }
  // 注册自定义书籍编辑器
  vscode.window.registerCustomEditorProvider('book-reader.openFile', new BookViewerProvider(context), option)
  // 注册侧边栏阅读
  vscode.window.registerWebviewViewProvider('bookReaderSidebar', new SidebarViewerProvider(context), option)
  // 侧边栏书籍列表
  const sidebarBookListProvider = new SidebarBookListProvider()
  vscode.window.createTreeView('bookReaderList', {
    treeDataProvider: sidebarBookListProvider,
    showCollapseAll: false,
  })
  const disposable = vscode.commands.registerCommand('book-reader.selectBookFolder', () =>
    sidebarBookListProvider.selectBookFolder(),
  )
  context.subscriptions.push(disposable)
  //book list打开书籍命令
  const openBookCommand = vscode.commands.registerCommand('book-reader.openBook', (book: Book) => {
    if (!book.uri) return
    if (Store.webviewMap.has(book.uri.toString())) {
      Store.webviewMap.get(book.uri.toString())?.reveal()
    } else {
      const panel = vscode.window.createWebviewPanel('bookReaderPanel', book.title, vscode.ViewColumn.Active)
      new BookViewerProvider(context).createBookPanel(book.uri, panel)
    }
  })
  context.subscriptions.push(openBookCommand)
  //book list在侧边栏打开书籍命令
  const openBookInSidebarCommand = vscode.commands.registerCommand(
    'book-reader.openBookInSidebar',
    (treeItem: TreeItem) => {
      const book = treeItem.book
      if (!book.uri) return
      const sliderWebview = Store.sliderWebview
      // 在侧边栏打开书籍
      sliderWebview?.show(true)
      sliderWebview?.webview.postMessage({
        type: 'openBook',
        content: sliderWebview?.webview.asWebviewUri(book.uri).toString(),
      })
    },
  )
  context.subscriptions.push(openBookInSidebarCommand)
}
