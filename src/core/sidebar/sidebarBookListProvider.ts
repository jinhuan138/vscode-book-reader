import * as vscode from 'vscode'
import * as path from 'path'

export interface Book {
  /** 书籍ID */
  id: string
  /** 书籍URL */
  uri?: vscode.Uri
  /** 书籍的标题 */
  title: string
  /** 书籍的摘要 */
  excerpt?: string
  /** 书籍的缩略图 */
  imgUrl?: string
}

export class TreeItem extends vscode.TreeItem {
  constructor(
    public readonly book: Book,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
  ) {
    super(book.title, collapsibleState)
    // 如果是文件夹项
    if (book.id === '__folder__') {
      this.command = {
        command: 'book-reader.selectBookFolder',
        title: 'Select Book Folder',
      }
      // 使用文件夹图标
      this.iconPath = new vscode.ThemeIcon('home')
    } else {
      // 如果是书籍项
      this.command = {
        command: 'book-reader.openBook',
        title: book.title,
        arguments: [book],
      }
      // 使用书籍图标
      this.iconPath = new vscode.ThemeIcon('book')
      this.tooltip = book.excerpt
      this.contextValue = 'bookItem'
    }
  }
}

/**
 * 侧边栏的书籍列表-树数据提供者
 */
export class SidebarBookListProvider implements vscode.TreeDataProvider<TreeItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<TreeItem | undefined | null | void> = new vscode.EventEmitter<
    TreeItem | undefined | null | void
  >()

  // 当数据改变时，树视图会监听此事件
  onDidChangeTreeData = this._onDidChangeTreeData.event

  private folder: vscode.Uri | undefined

  private bookList: Book[] = []

  // 支持的电子书扩展名
  private readonly supportedExtensions = ['.epub', '.mobi', '.azw3', '.pdf', '.fk8', '.fb2', '.cbz']

  constructor() {
    const config = vscode.workspace.getConfiguration('book-reader')
    const savedFolderPath = config.get<string>('bookFolderPath')
    const workspaceFolders = vscode.workspace.workspaceFolders // 获取工作区路径
    if (savedFolderPath) {
      this.folder = vscode.Uri.file(savedFolderPath)
      this.getBookList()
    } else if (workspaceFolders && workspaceFolders?.length > 0) {
      this.folder = workspaceFolders[0].uri
      this.getBookList()
    } else {
      this.selectBookFolder()
    }
  }

  getChildren(element?: TreeItem): Promise<TreeItem[]> {
    if (!element) {
      const folderItem = new TreeItem(
        {
          id: '__folder__',
          title: this.folder ? this.folder.fsPath : 'Select Book Folder',
        },
        vscode.TreeItemCollapsibleState.None,
      )
      return Promise.resolve([
        folderItem,
        ...this.bookList.map((book) => new TreeItem(book, vscode.TreeItemCollapsibleState.None)),
      ])
    }
    return Promise.resolve([])
  }

  getTreeItem(element: TreeItem): TreeItem {
    return element
  }

  selectBookFolder() {
    const defaultUri = this.folder ?? vscode.workspace.workspaceFolders?.[0]?.uri
    vscode.window
      .showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Book Folder',
        title: 'Choose Book Storage Directory',
        defaultUri,
      })
      .then((uris) => {
        if (uris && uris.length > 0) {
          this.folder = uris[0]
          vscode.window.showInformationMessage(`Book folder set to: ${this.folder.fsPath}`)
          const config = vscode.workspace.getConfiguration('book-reader')
          config.update('bookFolderPath', this.folder.fsPath, vscode.ConfigurationTarget.Global)
          this.getBookList()
        }
      })
  }
  /**
   * 获取文件夹下的书籍文件并更新列表
   */
  async getBookList() {
    if (!this.folder) {
      console.warn('No folder selected for books.')
      return
    }

    try {
      // 读取目录下的所有文件和子目录
      // readDirectory 返回 [string, FileType][] 数组
      const files = await vscode.workspace.fs.readDirectory(this.folder)
      const newBookList: Book[] = []

      for (const [name, type] of files) {
        // 只处理文件，忽略文件夹
        if (type !== vscode.FileType.File) {
          continue
        }

        // 检查扩展名是否支持
        const ext = path.extname(name).toLowerCase()
        if (this.supportedExtensions.includes(ext)) {
          const fileUri = vscode.Uri.joinPath(this.folder, name)

          // 构造 Book 对象
          const book: Book = {
            id: '', // 使用 URI 字符串作为唯一 ID
            uri: fileUri,
            title: name,
            excerpt: '', // 简单摘要
            imgUrl: '', // 暂时为空，后续可提取封面
          }
          newBookList.push(book)
        }
      }

      // 更新列表
      this.bookList = newBookList
      // 通知树视图数据已更改，触发重新渲染
      this._onDidChangeTreeData.fire()
    } catch (error) {
      console.error('Failed to read book directory:', error)
      vscode.window.showErrorMessage(`读取书籍文件夹失败: ${error}`)
    }
  }
}
