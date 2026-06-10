import * as vscode from 'vscode'
import { BookViewerProvider } from './core/bookViewerProvider'
import { SidebarViewerProvider } from './core/sidebar/sidebarViewerProvider'
import { SidebarBookListProvider } from './core/sidebar/sidebarBookListProvider'
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
  SidebarBookListProvider.getInstance().initialize(context)
}
