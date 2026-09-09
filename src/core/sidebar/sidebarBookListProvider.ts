import * as vscode from 'vscode'
import * as path from 'path'
import { BookViewerProvider } from '../bookViewerProvider'
import { Store } from '../store'

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
export class SidebarBookListProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
  private static instance: SidebarBookListProvider

  private treeView: vscode.TreeView<vscode.TreeItem> | undefined

  public static getInstance(): SidebarBookListProvider {
    if (!SidebarBookListProvider.instance) {
      SidebarBookListProvider.instance = new SidebarBookListProvider()
    }
    return SidebarBookListProvider.instance
  }

  private _onDidChangeTreeData = new vscode.EventEmitter<vscode.TreeItem | undefined | null | void>()

  // 当数据改变时，树视图会监听此事件
  onDidChangeTreeData = this._onDidChangeTreeData.event

  private folder: vscode.Uri | undefined

  private bookList: Book[] = []

  // 支持的电子书扩展名
  private readonly supportedExtensions = ['.epub', '.mobi', '.azw3', '.pdf', '.fk8', '.fb2', '.cbz', '.txt']

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

  getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
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

  getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
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
          const fileUri = vscode.Uri.joinPath(this.folder!, name)

          const book: Book = {
            id: '',
            uri: fileUri,
            title: name,
            excerpt: '',
            imgUrl: '',
          }
          newBookList.push(book)
        }
      }

      this.bookList = newBookList
      this._onDidChangeTreeData.fire()
    } catch (error: unknown) {
      console.error('读取书籍文件夹失败', error)
      vscode.window.showErrorMessage(`Failed to read book directory: ${error}`)
    }
  }

  public initialize(context: vscode.ExtensionContext): void {
    this.treeView = vscode.window.createTreeView('bookReaderList', {
      treeDataProvider: this,
      showCollapseAll: false,
    })

    const selectFolderCmd = vscode.commands.registerCommand('book-reader.selectBookFolder', () =>
      this.selectBookFolder(),
    )

    const openBookCmd = vscode.commands.registerCommand('book-reader.openBook', (book: Book) => {
      if (!book.uri) return
      if (Store.webviewMap.has(book.uri.toString())) {
        Store.webviewMap.get(book.uri.toString())?.reveal()
      } else {
        const panel = vscode.window.createWebviewPanel('bookReaderPanel', book.title, vscode.ViewColumn.Active)
        new BookViewerProvider(context).createBookPanel(book.uri, panel)
      }
      // 开书后如果伪装开关已开，切换到假文件列表
    })

    const openBookInSidebarCmd = vscode.commands.registerCommand(
      'book-reader.openBookInSidebar',
      (treeItem: TreeItem) => {
        const book = treeItem.book
        if (!book.uri) return
        const sliderWebview = Store.sliderWebview
        sliderWebview?.show(true)
        sliderWebview?.webview.postMessage({
          type: 'openBook',
          content: sliderWebview?.webview.asWebviewUri(book.uri).toString(),
        })
        // 开书后如果伪装开关已开，切换到假文件列表
      },
    )

    // 点击假文件 → 恢复真实书单


    // 切换侧边栏伪装（假文件树 + 阅读器失焦清空）


    // 刷新文件列表
    const refreshBookListCmd = vscode.commands.registerCommand('book-reader.refreshBookList', () => {
      this.getBookList()
      vscode.window.showInformationMessage('Book list refreshed')
    })

    context.subscriptions.push(
      this.treeView!,
      selectFolderCmd,
      openBookCmd,
      openBookInSidebarCmd,
      refreshBookListCmd,
    )
  }
}
