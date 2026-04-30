import * as vscode from 'vscode'

export interface Item {
  /** 书籍ID */
  id: string
  /** 书籍URL */
  url: string
  /** 书籍的标题 */
  title: string
  /** 书籍的摘要 */
  excerpt: string
  /** 书籍的缩略图 */
  imgUrl: string
}

class ListItem extends vscode.TreeItem {
  constructor(
    public readonly item: Item,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(item.title, collapsibleState)
  }
}

/**
 * 侧边栏的书籍列表-树数据提供者
 */
export class sidebarBookListProvider implements vscode.TreeDataProvider<ListItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<ListItem | undefined | null | void> = new vscode.EventEmitter<
    ListItem | undefined | null | void
  >()
  getChildren(element?: ListItem): Thenable<ListItem[]> {
    return Promise.resolve([])
  }
  getTreeItem(element: ListItem): ListItem {
    return element
  }

  refreshView(): void {
    console.log('刷新书籍列表显示...')
    this._onDidChangeTreeData.fire()
  }
}
