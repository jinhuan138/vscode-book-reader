import * as vscode from 'vscode'
import * as path from 'path'
import { BookViewerProvider } from '../bookViewerProvider'
import { Store } from '../store'

// ─── 假文件生成相关 ────────────────────────────────────────────
const FILE_TYPES = [
  {
    ext: '.ts',
    names: [
      'index',
      'main',
      'app',
      'config',
      'utils',
      'helper',
      'service',
      'controller',
      'model',
      'router',
      'types',
      'store',
      'hooks',
    ],
  },
  {
    ext: '.tsx',
    names: [
      'App',
      'Layout',
      'Header',
      'Footer',
      'Button',
      'Input',
      'Modal',
      'Table',
      'Form',
      'Card',
      'List',
      'Sidebar',
    ],
  },
  {
    ext: '.js',
    names: ['index', 'main', 'app', 'config', 'utils', 'webpack.config', 'babel.config', 'jest.config', 'vite.config'],
  },
  { ext: '.json', names: ['package', 'tsconfig', 'settings', 'data', 'schema', 'manifest'] },
  { ext: '.md', names: ['README', 'CHANGELOG', 'CONTRIBUTING', 'TODO', 'NOTES', 'API'] },
  { ext: '.scss', names: ['index', 'main', '_variables', '_mixins', '_layout', '_components', 'theme'] },
  {
    ext: '.vue',
    names: ['App', 'Home', 'About', 'Login', 'Dashboard', 'Profile', 'Settings', 'Header', 'Footer', 'Sidebar'],
  },
  { ext: '.go', names: ['main', 'server', 'handler', 'router', 'model', 'config', 'utils'] },
  { ext: '.yml', names: ['docker-compose', 'workflow', 'config', 'build', 'deploy', 'ci'] },
]
const FOLDER_NAMES = [
  'src',
  'lib',
  'test',
  'tests',
  'docs',
  'public',
  'assets',
  'config',
  'scripts',
  'utils',
  'helpers',
  'components',
  'pages',
  'api',
  'models',
  'views',
  'controllers',
  'services',
  'hooks',
]

function makeRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 1664525 + 1013904223) & 0x7fffffff
    return s / 0x7fffffff
  }
}
function pick<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)]
}
function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
      ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

class FakeFileItem extends vscode.TreeItem {
  children?: FakeFileItem[]
  constructor(name: string, isFolder: boolean, children?: FakeFileItem[]) {
    super(name, isFolder ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None)
    this.children = children
    this.resourceUri = vscode.Uri.file(`/fake-project/${name}`)
    if (!isFolder) {
      this.command = {
        command: 'book-reader.showBookList',
        title: 'Show Books',
        arguments: [],
      }
    }
  }
}

function generateFakeTree(seed: number): FakeFileItem[] {
  const rand = makeRand(seed)
  const items: FakeFileItem[] = []
  const folderCount = 2 + Math.floor(rand() * 3)
  const folders = shuffle(FOLDER_NAMES, rand).slice(0, folderCount)
  for (const folderName of folders) {
    const fileCount = 2 + Math.floor(rand() * 5)
    const files: FakeFileItem[] = []
    const usedNames = new Set<string>()
    for (let i = 0; i < fileCount; i++) {
      const type = pick(FILE_TYPES, rand)
      const baseName = pick(type.names, rand)
      let fileName = `${baseName}${type.ext}`
      if (usedNames.has(fileName)) fileName = `${baseName}2${type.ext}`
      usedNames.add(fileName)
      files.push(new FakeFileItem(fileName, false))
    }
    items.push(new FakeFileItem(folderName, true, files))
  }
  const rootFiles = shuffle(
    [
      { name: 'package.json' },
      { name: 'tsconfig.json' },
      { name: 'README.md' },
      { name: '.gitignore' },
      { name: 'vite.config.ts' },
      { name: 'jest.config.js' },
    ],
    rand,
  ).slice(0, 1 + Math.floor(rand() * 3))
  for (const f of rootFiles) items.push(new FakeFileItem(f.name, false))
  return items
}

// ─── 书籍相关类型 ──────────────────────────────────────────────
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

  /** 是否处于伪装模式（运行时状态） */
  private isDisguised = false
  /** 当前伪装文件树 */
  private fakeTree: FakeFileItem[] = []
  /** 树视图引用，用于动态切换标题 */
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

  /**
   * 切换伪装模式
   * @param disguised true=显示假文件，false=显示真实书单
   */
  public async setDisguised(disguised: boolean): Promise<void> {
    if (this.isDisguised === disguised) return
    this.isDisguised = disguised
    if (this.treeView) this.treeView.title = disguised ? 'project files' : 'book list'
    if (disguised) {
      this.fakeTree = generateFakeTree(Date.now())
      this._onDidChangeTreeData.fire()
    } else {
      await this.getBookList()
    }
  }

  getChildren(element?: vscode.TreeItem): Promise<vscode.TreeItem[]> {
    // 伪装模式：返回假文件树
    if (this.isDisguised) {
      if (!element) return Promise.resolve(this.fakeTree)
      return Promise.resolve((element as FakeFileItem).children ?? [])
    }
    // 正常模式：返回书单
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
      const disguiseEnabled = vscode.workspace.getConfiguration('book-reader').get<boolean>('sidebarDisguise', false)
      if (disguiseEnabled) this.setDisguised(true)
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
        const sidebarDisguiseEnabled = vscode.workspace.getConfiguration('book-reader').get<boolean>('sidebarDisguise', false)
        if (sidebarDisguiseEnabled) this.setDisguised(true)
      },
    )

    // 点击假文件 → 恢复真实书单
    const showBookListCmd = vscode.commands.registerCommand('book-reader.showBookList', () => {
      this.setDisguised(false)
    })

    // 切换侧边栏伪装（假文件树 + 阅读器失焦清空）
    // 以运行时状态 this.isDisguised 为准，确保点击眼睛图标时能正确切换
    const toggleSidebarDisguiseCmd = vscode.commands.registerCommand('book-reader.toggleSidebarDisguise', () => {
      const newState = !this.isDisguised
      const config = vscode.workspace.getConfiguration('book-reader')
      config.update('sidebarDisguise', newState, vscode.ConfigurationTarget.Global)
      this.setDisguised(newState)
    })

    // 刷新文件列表
    const refreshBookListCmd = vscode.commands.registerCommand('book-reader.refreshBookList', () => {
      if (this.isDisguised) {
        this.fakeTree = generateFakeTree(Date.now())
        this._onDidChangeTreeData.fire()
        vscode.window.showInformationMessage('Disguised file list refreshed')
      } else {
        this.getBookList()
        vscode.window.showInformationMessage('Book list refreshed')
      }
    })

    context.subscriptions.push(
      this.treeView!,
      selectFolderCmd,
      openBookCmd,
      openBookInSidebarCmd,
      showBookListCmd,
      toggleSidebarDisguiseCmd,
      refreshBookListCmd,
    )
  }
}
