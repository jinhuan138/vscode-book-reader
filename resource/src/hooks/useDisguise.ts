import { ref, watch, computed } from 'vue'
import useVscode from './useVscode'
import useInfo from './useInfo'

const lineCount = ref(100)
const fileType = ref('')
const vscode = useVscode()
const information = useInfo()
const defaultDisguise = JSON.parse(localStorage.getItem('disguise') || 'false')
const disguise = ref<boolean>(defaultDisguise)
const active = ref<boolean>(true)
const showBook = ref(true)
const title = computed(() => {
  return active.value ? information.value.title : fileName
})

window.addEventListener('message', ({ data }) => {
  if (!disguise.value) {
    return
  }
  if (data && data.type === 'active') {
    active.value = data.content
  }
})
document.body.onkeydown = function (event: KeyboardEvent) {
  // 禁用空格键的默认滚动行为
  if (event.key === ' ' || event.code === 'Space') {
    active.value = !active.value
    event.preventDefault()
  }
}
export default function useDisguise(isSidebar = false) {
  watch(disguise, (enabled) => {
    if (!enabled) {
      showBook.value = true
    }
    localStorage.setItem('disguise', String(enabled))
    if (!isSidebar && vscode) {
      vscode.postMessage({
        type: 'disguise',
        content: enabled,
      })
    }
  })
  const codeLines = computed(() => {
    const generator = getCodeGenerator(fileType.value)
    const lines = []
    for (let i = 0; i < lineCount.value; i++) {
      const line = generator()
      if (line) {
        // 对生成的代码行进行特殊字符转换
        lines.push(line)
      }
    }
    return lines
  })
  watch(active, (val) => {
    if (!disguise.value) {
      return
    }
    if (val) {
      setTimeout(() => {
        showBook.value = true
      }, 300)
    } else {
      showBook.value = false
    }
    if (vscode) {
      vscode.postMessage({
        type: 'title',
        content: title.value,
      })
    }
  })

  return { disguise, active, showBook, codeLines }
}
/** 文件类型映射表 */

const FILE_TYPE_MAP = {
  'file_type_cheader.svg': {
    extensions: ['.h'],
    names: ['stdio', 'stdlib', 'string', 'math', 'time', 'ctype', 'assert', 'errno', 'limits', 'signal', 'stdarg', 'stddef', 'setjmp', 'locale', 'float'],
    prefixes: ['', 'lib', 'sys_', 'user_', 'app_', 'core_', 'util_', 'helper_'],
  },
  'file_type_cpp.svg': {
    extensions: ['.cpp', '.cc', '.cxx'],
    names: ['main', 'index', 'app', 'core', 'utils', 'helper', 'service', 'manager', 'controller', 'model', 'view', 'test', 'demo', 'example'],
    prefixes: ['', 'my_', 'app_', 'user_', 'system_', 'data_', 'file_', 'net_', 'db_', 'api_'],
  },
  'file_type_cppheader.svg': {
    extensions: ['.hpp', '.hxx', '.h++'],
    names: ['common', 'config', 'types', 'constants', 'macros', 'utils', 'helper', 'interface', 'abstract', 'base', 'core', 'system'],
    prefixes: ['', 'lib', 'sys_', 'user_', 'app_', 'core_', 'util_', 'i_', 'abstract_'],
  },
  'file_type_csharp.svg': {
    extensions: ['.cs'],
    names: ['Program', 'Startup', 'Controller', 'Service', 'Model', 'Repository', 'Helper', 'Manager', 'Handler', 'Provider', 'Factory', 'Builder'],
    prefixes: ['', 'I', 'Base', 'Abstract', 'User', 'System', 'Data', 'File', 'Network', 'Database', 'Api'],
  },
  'file_type_css.svg': {
    extensions: ['.css'],
    names: ['style', 'main', 'app', 'layout', 'theme', 'component', 'global', 'reset', 'normalize', 'responsive', 'print', 'mobile'],
    prefixes: ['', 'base-', 'layout-', 'component-', 'page-', 'theme-', 'vendor-', 'custom-', 'responsive-'],
  },
  'file_type_git.svg': {
    extensions: ['.gitignore', '.gitattributes', '.gitmodules'],
    names: ['gitignore', 'gitattributes', 'gitmodules'],
    prefixes: ['', '.', 'local-', 'global-'],
  },
  'file_type_html.svg': {
    extensions: ['.html', '.htm'],
    names: ['index', 'home', 'about', 'contact', 'login', 'register', 'dashboard', 'profile', 'settings', 'help', '404', '500'],
    prefixes: ['', 'page-', 'template-', 'layout-', 'partial-', 'component-', 'widget-', 'section-'],
  },
  'file_type_ini.svg': {
    extensions: ['.ini', '.cfg', '.conf'],
    names: ['config', 'settings', 'app.config', 'database', 'cache', 'session', 'logging', 'security', 'api', 'system', 'user', 'default'],
    prefixes: ['', 'app.', 'system.', 'user.', 'db.', 'cache.', 'log.', 'auth.', 'api.', 'service.'],
  },
  'file_type_java.svg': {
    extensions: ['.java'],
    names: ['Main', 'Application', 'Controller', 'Service', 'Repository', 'Model', 'Entity', 'Dto', 'Config', 'Utils', 'Helper', 'Manager'],
    prefixes: ['', 'Base', 'Abstract', 'I', 'User', 'System', 'Data', 'File', 'Network', 'Database', 'Api', 'Test'],
  },
  'file_type_js.svg': {
    extensions: ['.js', '.mjs'],
    names: ['index', 'main', 'app', 'config', 'utils', 'helper', 'service', 'controller', 'model', 'router', 'middleware', 'component', 'test'],
    prefixes: ['', 'app-', 'user-', 'admin-', 'api-', 'db-', 'file-', 'net-', 'util-', 'test-', 'demo-'],
  },
  'file_type_json.svg': {
    extensions: ['.json'],
    names: ['package', 'config', 'settings', 'data', 'schema', 'manifest', 'tsconfig', 'babel.config', 'webpack.config', 'eslint.config'],
    prefixes: ['', 'app-', 'user-', 'system-', 'test-', 'dev-', 'prod-', 'local-', 'global-'],
  },
  'file_type_less.svg': {
    extensions: ['.less'],
    names: ['style', 'main', 'app', 'variables', 'mixins', 'layout', 'components', 'theme', 'responsive', 'utilities'],
    prefixes: ['', 'base-', 'layout-', 'component-', 'page-', 'theme-', 'vendor-', 'custom-', 'util-'],
  },
  'file_type_light_tex.svg': {
    extensions: ['.tex', '.latex'],
    names: ['main', 'document', 'chapter', 'section', 'article', 'report', 'book', 'thesis', 'presentation', 'bibliography', 'appendix', 'abstract'],
    prefixes: ['', 'ch_', 'sec_', 'fig_', 'tab_', 'ref_', 'bib_', 'app_', 'doc_', 'draft_'],
  },
  'file_type_light_yaml.svg': {
    extensions: ['.yaml', '.yml'],
    names: ['config', 'docker-compose', 'workflow', 'pipeline', 'database', 'server', 'deploy', 'build', 'test', 'environment', 'secrets'],
    prefixes: ['', 'app-', 'dev-', 'prod-', 'test-', 'staging-', 'local-', 'ci-', 'cd-', 'k8s-'],
  },
  'file_type_log.svg': {
    extensions: ['.log', '.txt'],
    names: ['application', 'error', 'access', 'debug', 'system', 'security', 'audit', 'performance', 'trace', 'console', 'server', 'database'],
    prefixes: ['', 'app-', 'error-', 'access-', 'debug-', 'sys-', 'auth-', 'perf-', 'trace-', 'db-'],
  },
  'file_type_lua.svg': {
    extensions: ['.lua'],
    names: ['init', 'config', 'main', 'utils', 'helper', 'module', 'script', 'test', 'game', 'addon', 'plugin', 'extension'],
    prefixes: ['', 'lib_', 'mod_', 'game_', 'ui_', 'net_', 'db_', 'util_', 'test_', 'addon_', 'plugin_'],
  },
  'file_type_markdown.svg': {
    extensions: ['.md', '.markdown'],
    names: ['README', 'CHANGELOG', 'LICENSE', 'CONTRIBUTING', 'docs', 'guide', 'tutorial', 'api', 'install', 'usage', 'faq', 'notes'],
    prefixes: ['', 'doc-', 'guide-', 'tutorial-', 'api-', 'readme-', 'changelog-', 'license-', 'contrib-'],
  },
  'file_type_php3.svg': {
    extensions: ['.php'],
    names: ['index', 'config', 'functions', 'class', 'model', 'controller', 'view', 'helper', 'service', 'repository', 'middleware'],
    prefixes: ['', 'app_', 'user_', 'admin_', 'api_', 'db_', 'file_', 'mail_', 'cache_', 'session_', 'auth_'],
  },
  'file_type_powershell.svg': {
    extensions: ['.ps1', '.psm1', '.psd1'],
    names: ['Install', 'Deploy', 'Setup', 'Config', 'Backup', 'Restore', 'Test', 'Build', 'Clean', 'Update', 'Remove', 'Get-Info'],
    prefixes: ['', 'System-', 'User-', 'Admin-', 'Network-', 'File-', 'Database-', 'Service-', 'Process-', 'Registry-'],
  },
  'file_type_python.svg': {
    extensions: ['.py', '.pyw'],
    names: ['main', 'app', 'config', 'utils', 'helper', 'model', 'view', 'controller', 'service', 'test', 'script', 'cli', 'setup'],
    prefixes: ['', 'app_', 'user_', 'admin_', 'api_', 'db_', 'file_', 'net_', 'util_', 'test_', 'cli_', 'script_'],
  },
  'file_type_r.svg': {
    extensions: ['.r', '.R', '.rmd'],
    names: ['analysis', 'plot', 'data', 'model', 'stats', 'regression', 'clustering', 'visualization', 'report', 'script', 'utils', 'functions'],
    prefixes: ['', 'data_', 'plot_', 'model_', 'stats_', 'viz_', 'analysis_', 'report_', 'util_', 'test_'],
  },
  'file_type_ruby.svg': {
    extensions: ['.rb', '.rbw'],
    names: ['app', 'config', 'controller', 'model', 'view', 'helper', 'service', 'spec', 'test', 'rake', 'gem', 'script'],
    prefixes: ['', 'app_', 'user_', 'admin_', 'api_', 'db_', 'file_', 'net_', 'util_', 'test_', 'spec_', 'lib_'],
  },
  'file_type_rust.svg': {
    extensions: ['.rs'],
    names: ['main', 'lib', 'mod', 'config', 'utils', 'helper', 'service', 'model', 'test', 'bin', 'examples', 'bench'],
    prefixes: ['', 'app_', 'user_', 'sys_', 'net_', 'db_', 'file_', 'util_', 'test_', 'bench_', 'example_'],
  },
  'file_type_rust_toolchain.svg': {
    extensions: ['rust-toolchain', 'rust-toolchain.toml'],
    names: ['rust-toolchain', 'toolchain'],
    prefixes: ['', 'stable-', 'beta-', 'nightly-', 'custom-'],
  },
  'file_type_scss.svg': {
    extensions: ['.scss'],
    names: ['style', 'main', 'app', '_variables', '_mixins', '_functions', '_base', '_layout', '_components', '_utilities'],
    prefixes: ['', '_', 'base-', 'layout-', 'component-', 'page-', 'theme-', 'vendor-', 'util-'],
  },
  'file_type_sql.svg': {
    extensions: ['.sql'],
    names: ['schema', 'migration', 'seed', 'query', 'procedure', 'function', 'trigger', 'view', 'index', 'backup', 'restore', 'data'],
    prefixes: ['', 'create_', 'drop_', 'alter_', 'insert_', 'update_', 'delete_', 'select_', 'proc_', 'func_', 'v_'],
  },
  'file_type_swift.svg': {
    extensions: ['.swift'],
    names: ['AppDelegate', 'ViewController', 'Model', 'View', 'Service', 'Manager', 'Helper', 'Extension', 'Protocol', 'Enum', 'Struct', 'Test'],
    prefixes: ['', 'UI', 'NS', 'CG', 'CA', 'Core', 'Foundation', 'UIKit', 'SwiftUI', 'Combine', 'Test'],
  },
  'file_type_typescript.svg': {
    extensions: ['.ts'],
    names: ['index', 'main', 'app', 'config', 'types', 'interfaces', 'utils', 'helper', 'service', 'controller', 'model', 'component'],
    prefixes: ['', 'app-', 'user-', 'admin-', 'api-', 'db-', 'file-', 'net-', 'util-', 'test-', 'i-', 'abstract-'],
  },
  'file_type_typescriptdef.svg': {
    extensions: ['.d.ts'],
    names: ['global', 'types', 'interfaces', 'api', 'models', 'components', 'utils', 'config', 'constants', 'enums'],
    prefixes: ['', 'global-', 'app-', 'api-', 'component-', 'util-', 'test-', '@types/'],
  },
  'file_type_vue.svg': {
    extensions: ['.vue'],
    names: ['App', 'Home', 'About', 'Contact', 'Login', 'Register', 'Dashboard', 'Profile', 'Settings', 'Header', 'Footer', 'Sidebar'],
    prefixes: ['', 'Base', 'Layout', 'Page', 'Component', 'Widget', 'Section', 'User', 'Admin', 'Auth'],
  },
  'file_type_xml.svg': {
    extensions: ['.xml', '.xsd', '.xsl'],
    names: ['config', 'settings', 'data', 'schema', 'stylesheet', 'manifest', 'sitemap', 'feed', 'layout', 'template'],
    prefixes: ['', 'app-', 'system-', 'user-', 'web-', 'api-', 'db-', 'file-', 'service-', 'component-'],
  },
  'file_type_xsl.svg': {
    extensions: ['.xsl', '.xslt'],
    names: ['transform', 'stylesheet', 'template', 'format', 'convert', 'report', 'layout', 'presentation', 'document', 'output'],
    prefixes: ['', 'xsl-', 'transform-', 'template-', 'format-', 'report-', 'doc-', 'output-', 'convert-'],
  },
}

// 随机选择一个文件类型
const finalTypes = Object.keys(FILE_TYPE_MAP)
const randomIconFile = finalTypes[Math.floor(Math.random() * finalTypes.length)]
const fileTypeInfo = FILE_TYPE_MAP[randomIconFile as keyof typeof FILE_TYPE_MAP]

fileType.value = randomIconFile

// 随机生成文件名
const randomName = fileTypeInfo.names[Math.floor(Math.random() * fileTypeInfo.names.length)]
const randomPrefix = fileTypeInfo.prefixes[Math.floor(Math.random() * fileTypeInfo.prefixes.length)]
const randomExtension = fileTypeInfo.extensions[Math.floor(Math.random() * fileTypeInfo.extensions.length)]

// 组合最终的文件名
const fileName = `${randomPrefix}${randomName}${randomExtension}`

const patternIndexes = new Map()

/**
 * 获取下一个模式（按顺序循环）
 */
const getNextPattern = <T>(fileType: string, patterns: T[]): T => {
  if (!patternIndexes.has(fileType)) {
    patternIndexes.set(fileType, 0)
  }

  const currentIndex = patternIndexes.get(fileType)
  const pattern = patterns[currentIndex]

  // 循环到下一个模式
  patternIndexes.set(fileType, (currentIndex + 1) % patterns.length)

  return pattern
}

/**
 * 生成随机辅助方法
 */
const randomChoice = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}
const randomVariableName = () => {
  const names = ['data', 'result', 'value', 'item', 'element', 'obj', 'config', 'options', 'params', 'response', 'request', 'user', 'id', 'name', 'type', 'status', 'count', 'index', 'key', 'flag']
  return randomChoice(names)
}

const randomFunctionName = () => {
  const names = ['getData', 'setData', 'handleClick', 'processItem', 'validate', 'initialize', 'update', 'create', 'delete', 'fetch', 'parse', 'format', 'transform', 'calculate', 'generate']
  return randomChoice(names)
}

const randomClassName = () => {
  const names = ['UserManager', 'DataService', 'ApiClient', 'ConfigHandler', 'BaseController', 'ModelValidator', 'FileProcessor', 'EventEmitter', 'CacheManager', 'Logger']
  return randomChoice(names)
}

const randomValue = () => {
  const values = ['null', 'true', 'false', '0', '1', '""', '[]', '{}', 'undefined']
  return randomChoice(values)
}

const randomString = () => {
  const strings = ['"Hello World"', '"Success"', '"Error"', '"Loading..."', '"Data loaded"', '"Invalid input"', '"Processing"', '"Complete"']
  return randomChoice(strings)
}

const randomComment = () => {
  const comments = ['TODO: Implement this method', 'FIXME: Handle edge case', 'NOTE: this is a temporary solution', 'BUG: Memory leak possible', 'REVIEW: Optimize performance']
  return randomChoice(comments)
}

const randomParameters = () => {
  const params = ['', 'data', 'options', 'callback', 'data, options', 'id, data', 'params, callback']
  return randomChoice(params)
}

const randomCondition = () => {
  const conditions = ['data', 'result', 'status === "success"', 'count > 0', 'user !== null', 'config.enabled']
  return randomChoice(conditions)
}

const randomMethod = () => {
  const methods = ['get', 'set', 'update', 'delete', 'create', 'process', 'handle', 'validate', 'parse', 'format']
  return randomChoice(methods)
}

const randomProperty = () => {
  const properties = ['id', 'name', 'value', 'data', 'config', 'status', 'type', 'count', 'index', 'key']
  return randomChoice(properties)
}

const randomModuleName = () => {
  const modules = ['utils', 'config', 'api', 'services', 'components', 'helpers', 'validators', 'models', 'controllers']
  return randomChoice(modules)
}

const randomAsyncCall = () => {
  const calls = ['fetch(url)', 'api.getData()', 'database.query()', 'service.process()', 'client.request()']
  return randomChoice(calls)
}

const randomType = () => {
  const types = ['string', 'number', 'boolean', 'object', 'array', 'Date', 'Promise<string>', 'void', 'any']
  return randomChoice(types)
}

const randomInterfaceName = () => {
  const names = ['IUser', 'IData', 'IConfig', 'IResponse', 'IRequest', 'IModel', 'IService', 'IHandler']
  return randomChoice(names)
}

const randomTypeName = () => {
  const names = ['UserType', 'DataType', 'StatusType', 'ConfigType', 'ResponseType']
  return randomChoice(names)
}

const randomEnumName = () => {
  const names = ['Status', 'Type', 'Mode', 'State', 'Level', 'Priority']
  return randomChoice(names)
}

const randomEnumValue = () => {
  const values = ['SUCCESS', 'ERROR', 'LOADING', 'PENDING', 'ACTIVE', 'INACTIVE']
  return randomChoice(values)
}

const randomFileName = () => {
  const names = ['index', 'main', 'config', 'utils', 'helper', 'service', 'model', 'controller']
  return randomChoice(names)
}

const randomPythonParameters = () => {
  const params = ['', 'data', 'options=None', 'callback=None', 'data, options=None', '*args, **kwargs']
  return randomChoice(params)
}

const randomJavaParameters = () => {
  const params = ['', 'String data', 'int count', 'Object options', 'String data, int count', 'List<String> items']
  return randomChoice(params)
}

const randomCppParameters = () => {
  const params = ['', 'int data', 'string name', 'const Object& obj', 'int data, string name']
  return randomChoice(params)
}

const randomCSharpParameters = () => {
  const params = ['', 'string data', 'int count', 'object options', 'string data, int count']
  return randomChoice(params)
}

const randomCppType = () => {
  const types = ['int', 'string', 'double', 'bool', 'char', 'float', 'void', 'auto']
  return randomChoice(types)
}

const randomCSharpType = () => {
  const types = ['string', 'int', 'double', 'bool', 'object', 'List<string>', 'Dictionary<string, object>']
  return randomChoice(types)
}

const randomHeaderName = () => {
  const headers = ['iostream', 'vector', 'string', 'map', 'algorithm', 'memory', 'functional']
  return randomChoice(headers)
}

const randomCssClass = () => {
  const classes = ['container', 'header', 'footer', 'nav', 'content', 'sidebar', 'button', 'form', 'input', 'card']
  return randomChoice(classes)
}

const randomCssProperty = () => {
  const properties = ['color', 'background-color', 'font-size', 'margin', 'padding', 'width', 'height', 'display', 'position', 'border']
  return randomChoice(properties)
}

const randomCssValue = () => {
  const values = ['#fff', '#000', '10px', '1rem', '100%', 'center', 'flex', 'none', 'auto', 'solid 1px #ccc']
  return randomChoice(values)
}

const randomJsonValue = () => {
  const values = ['"string"', '123', 'true', 'false', 'null']
  return randomChoice(values)
}

const randomNumber = () => {
  return Math.floor(Math.random() * 1000) + 1
}
/**
 * JavaScript 代码生成器 - 返回带有高亮样式的HTML
 */
const generateJavaScriptLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'const' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'let' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'var' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '();' }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'console' }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: 'log' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' { ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' } ' }, { c: 'mtk5', v: 'from' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomModuleName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'default' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'const' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk5', v: 'async' }, { c: 'mtk1', v: ' () =>' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'try' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'const' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'result' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk5', v: 'await' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomAsyncCall() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'result' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  } ' }, { c: 'mtk5', v: 'catch' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: 'error' }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'console' }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: 'error' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: 'error' }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk15', v: 'constructor' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'this' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'this' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * TypeScript定义文件代码生成器 - 返回带有高亮样式的对象数组
 */
const generateTypeScriptDefLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'declare' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'module' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `'${randomModuleName()}'` }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'interface' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomInterfaceName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: '?: ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: '): ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'type' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomTypeName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ' | ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: '): ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'const' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'declare' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'global' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'namespace' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomModuleName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'interface' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomInterfaceName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    }' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'as' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'namespace' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomModuleName() }, { c: 'mtk1', v: ';' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * C# 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateCSharpLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'using' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'System' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'using' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'System.Collections.Generic' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'using' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'System.Linq' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'namespace' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'private' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomCSharpType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' { get; set; }' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCSharpParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    }' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomCSharpType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    }' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'void' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCSharpParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk5', v: 'this' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    }' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'Console' }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: 'WriteLine' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '  } ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '();' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'var' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk5', v: 'new' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '();' }],
      [{ c: 'mtk16', v: 'List' }, { c: 'mtk1', v: '<' }, { c: 'mtk16', v: randomCSharpType() }, { c: 'mtk1', v: '> ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk5', v: 'new' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: 'List' }, { c: 'mtk1', v: '<' }, { c: 'mtk16', v: randomCSharpType() }, { c: 'mtk1', v: '>();' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * CHeader 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateCHeaderLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk17', v: '#include' }, { c: 'mtk1', v: ' <' }, { c: 'mtk11', v: randomHeaderName() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk17', v: '#include' }, { c: 'mtk1', v: ' "' }, { c: 'mtk11', v: `${randomFileName()}.h"` }, { c: 'mtk1', v: '"' }],
      [{ c: 'mtk17', v: '#define' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk4', v: '/* ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk4', v: ' */' }],
      [{ c: 'mtk5', v: 'typedef' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'struct' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'typedef' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'extern' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk5', v: 'void' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk17', v: '#ifdef' }, { c: 'mtk1', v: ' ' }, { c: 'mtk17', v: '__cplusplus' }],
      [{ c: 'mtk5', v: 'extern' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: '"C"' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk17', v: '#endif' }],
      [{ c: 'mtk5', v: 'enum' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomEnumValue() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomEnumValue() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk1', v: '};' }],
      [{ c: 'mtk17', v: '#endif' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * CppHeader 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateCppHeaderLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk17', v: '#pragma' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'once' }],
      [{ c: 'mtk17', v: '#include' }, { c: 'mtk1', v: ' <' }, { c: 'mtk11', v: randomHeaderName() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk17', v: '#include' }, { c: 'mtk1', v: ' "' }, { c: 'mtk11', v: `${randomFileName()}.h"` }, { c: 'mtk1', v: '"' }],
      [{ c: 'mtk4', v: '/// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'namespace' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '() = ' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'default' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'virtual' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: '~' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '() = ' }, { c: 'mtk1', v: ' ' }, { c: 'mt5', v: 'default' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ') ' }, { c: 'mt5', v: 'const' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk5', v: 'protected' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'private' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'void' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '};' }],
      [{ c: 'mtk5', v: 'template' }, { c: 'mtk1', v: ' <' }, { c: 'mtk5', v: 'typename' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'explicit' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '};' }],
      [{ c: 'mtk1', v: '} // ' }, { c: 'mtk9', v: 'namespace ' }, { c: 'mtk9', v: randomModuleName() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * SCSS 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateScssLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk12', v: '$' }, { c: 'mtk13', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: '@mixin' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk12', v: '&' }, { c: 'mtk12', v: ':hover' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: '@include' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: '@function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mt5', v: '@return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: '@each' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'in' }, { c: 'mtk1', v: ' (' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: '-' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: '@if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk5', v: '@else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk4', v: '/* ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk4', v: ' */' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Less 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateLessLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk12', v: '@' }, { c: 'mtk13', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk12', v: '&' }, { c: 'mtk12', v: ':hover' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: '@import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `'${randomFileName()}.less'` }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk12', v: '#gradient' }, { c: 'mtk1', v: ' (' }, { c: 'mt9', v: '@color' }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: 'background' }, { c: 'mtk1', v: ': ' }, { c: 'mt9', v: '@color' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: 'background' }, { c: 'mtk1', v: ': ' }, { c: 'mtk12', v: '#gradient' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: '@media' }, { c: 'mtk1', v: ' ' }, { c: 'mt5', v: 'screen' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'and' }, { c: 'mtk1', v: ' (' }, { c: 'mtk14', v: 'max-width' }, { c: 'mtk1', v: ': ' }, { c: 'mtk10', v: `${randomNumber()}px` }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk4', v: '/* ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk4', v: ' */' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * HTML 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateHtmlLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk1', v: '<!' }, { c: 'mtk18', v: 'DOCTYPE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'html' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '<' }, { c: 'mtk18', v: 'html' }, { c: 'mtk1', v: ' ' }, { c: 'mtk19', v: 'lang' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"en"' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '<' }, { c: 'mtk18', v: 'head' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk18', v: 'meta' }, { c: 'mtk1', v: ' ' }, { c: 'mtk19', v: 'charset' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"UTF-8"' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk18', v: 'meta' }, { c: 'mtk1', v: ' ' }, { c: 'mtk19', v: 'name' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"viewport"' }, { c: 'mtk1', v: ' ' }, { c: 'mtk19', v: 'content' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"width=device-width, initial-scale=1.0"' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk18', v: 'title' }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'title' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk18', v: 'link' }, { c: 'mtk1', v: ' ' }, { c: 'mtk19', v: 'rel' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"stylesheet"' }, { c: 'mtk1', v: ' ' }, { c: 'mtk19', v: 'href' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomFileName()}.css"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'head' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '<' }, { c: 'mtk18', v: 'body' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk18', v: 'header' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk18', v: 'nav' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk18', v: 'ul' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '        <' }, { c: 'mtk18', v: 'li' }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'li' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      </' }, { c: 'mtk18', v: 'ul' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    </' }, { c: 'mtk18', v: 'nav' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk18', v: 'header' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk18', v: 'main' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk18', v: 'section' }, { c: 'mtk1', v: ' ' }, { c: 'mtk19', v: 'class' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomCssClass()}"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk18', v: 'h1' }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'h1' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk18', v: 'p' }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'p' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    </' }, { c: 'mtk18', v: 'section' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk18', v: 'main' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk18', v: 'footer' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk18', v: 'p' }, { c: 'mtk1', v: '>&copy; ' }, { c: 'mtk10', v: new Date().getFullYear() }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'p' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk18', v: 'footer' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'body' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk18', v: 'html' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk4', v: '<!-- ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk4', v: ' -->' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * JSON 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateJsonLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk1', v: '{' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomJsonValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomJsonValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': [' }, { c: 'mtk11', v: randomJsonValue() }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: randomJsonValue() }, { c: 'mtk1', v: '],' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomJsonValue() }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk1', v: '[' }],
      [{ c: 'mtk1', v: '  {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomJsonValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomJsonValue() }],
      [{ c: 'mtk1', v: '  },' }],
      [{ c: 'mtk1', v: '  {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomJsonValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomJsonValue() }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: ']' }],
      [{ c: 'mtk4', v: '//' }, { c: 'mtk4', v: ' ' }, { c: 'mtk4', v: randomComment() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * XML 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateXmlLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk1', v: '<?xml' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'version' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"1.0"' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'encoding' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"UTF-8"' }, { c: 'mtk1', v: '?>' }],
      [{ c: 'mtk1', v: '<' }, { c: 'mtk5', v: 'root' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk5', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'id' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomNumber()}"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: randomProperty() }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: '</' }, { c: 'mtk5', v: randomProperty() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'type' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"text"' }, { c: 'mtk1', v: ' />' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: randomProperty() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk5', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'name' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomVariableName()}"` }, { c: 'mtk1', v: ' />' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk5', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'name' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomVariableName()}"` }, { c: 'mtk1', v: ' />' }],
      [{ c: 'mtk1', v: '    </' }, { c: 'mtk5', v: randomProperty() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <!-- ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk1', v: ' -->' }],
      [{ c: 'mtk1', v: '    <![CDATA[' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ']]>' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk5', v: randomVariableName() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk5', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'id' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomNumber()}"` }, { c: 'mtk1', v: ' />' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk5', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'id' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomNumber()}"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'attr' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomValue()}"` }, { c: 'mtk1', v: ' />' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk5', v: randomVariableName() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'root' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk4', v: '<!-- ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk4', v: ' -->' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Vue单文件组件代码生成器 - 返回带有高亮样式的对象数组
 */
const generateVueLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk1', v: '<' }, { c: 'mtk5', v: 'template' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk5', v: 'div' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'class' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomCssClass()}"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: 'h1' }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: `{{ ${randomProperty()} }}` }, { c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'h1' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: 'button' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '@click' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomMethod()}"` }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: randomComment() }, { c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'button' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: 'input' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'v-model' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomProperty()}"` }, { c: 'mtk1', v: ' />' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk5', v: 'div' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'template' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '<' }, { c: 'mtk5', v: 'script' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' { ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' } ' }, { c: 'mtk5', v: 'from' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `'${randomModuleName()}'` }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'default' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'name' }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: `'${randomClassName()}'` }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'data' }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '    };' }],
      [{ c: 'mtk1', v: '  },' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'methods' }, { c: 'mtk1', v: ': {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk5', v: 'this' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '    }' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '};' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'script' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '<' }, { c: 'mtk5', v: 'style' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'scoped' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '.' }, { c: 'mtk16', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'style' }, { c: 'mtk1', v: '>' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * XSL样式表代码生成器 - 返回带有高亮样式的对象数组
 */
const generateXslLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk1', v: '<?xml' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'version' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"1.0"' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'encoding' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"UTF-8"' }, { c: 'mtk1', v: '?>' }],
      [{ c: 'mtk1', v: '<' }, { c: 'mtk5', v: 'xsl:stylesheet' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'version' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"1.0"' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'xmlns:xsl' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"http://www.w3.org/1999/XSL/Transform"' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk5', v: 'xsl:template' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'match' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"/"' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: 'html' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk5', v: 'head' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '        <' }, { c: 'mtk5', v: 'title' }, { c: 'mtk1', v: '>' }, { c: 'mtk11', v: randomComment() }, { c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'title' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      </' }, { c: 'mtk5', v: 'head' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk5', v: 'body' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '        <' }, { c: 'mtk5', v: 'xsl:for-each' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'select' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomVariableName()}"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '          <' }, { c: 'mtk5', v: 'div' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '            <' }, { c: 'mtk5', v: 'xsl:value-of' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'select' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomProperty()}"` }, { c: 'mtk1', v: '/>' }],
      [{ c: 'mtk1', v: '          </' }, { c: 'mtk5', v: 'div' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '        </' }, { c: 'mtk5', v: 'xsl:for-each' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      </' }, { c: 'mtk5', v: 'body' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    </' }, { c: 'mtk5', v: 'html' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk5', v: 'xsl:template' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  <' }, { c: 'mtk5', v: 'xsl:template' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'match' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomVariableName()}"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    <' }, { c: 'mtk5', v: 'xsl:if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'test' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: `"${randomProperty()} != ''"` }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '      <' }, { c: 'mtk5', v: 'span' }, { c: 'mtk1', v: '><' }, { c: 'mtk5', v: 'xsl:value-of' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'select' }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: '"."' }, { c: 'mtk1', v: '/></' }, { c: 'mtk5', v: 'span' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '    </' }, { c: 'mtk5', v: 'xsl:if' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '  </' }, { c: 'mtk5', v: 'xsl:template' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk1', v: '</' }, { c: 'mtk5', v: 'xsl:stylesheet' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk4', v: '<!-- ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk4', v: ' -->' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * YAML 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateYamlLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk9', v: 'version:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `'${randomNumber()}'` }],
      [{ c: 'mtk9', v: 'name:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"${randomVariableName()}"` }],
      [{ c: 'mtk9', v: 'description:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"${randomComment()}"` }],
      [{ c: 'mtk9', v: 'author:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"${randomVariableName()}"` }],
      [{ c: 'mtk9', v: 'license:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: 'MIT' }],
      [{ c: 'mtk9', v: 'scripts:' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'start:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"node index.js"` }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'test:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"jest"` }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'build:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"webpack --mode production"` }],
      [{ c: 'mtk9', v: 'dependencies:' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'react:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: '^18.2.0' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'express:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: '^4.18.0' }],
      [{ c: 'mtk9', v: 'devDependencies:' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'typescript:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: '^4.9.0' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'webpack:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: '^5.75.0' }],
      [{ c: 'mtk9', v: 'database:' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'host:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: 'localhost' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'port:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk10', v: '5432' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'name:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: 'myapp' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'user:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: 'admin' }],
      [{ c: 'mtk9', v: 'server:' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'port:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk10', v: '3000' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'host:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: '0.0.0.0' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'ssl:' }, { c: 'mtk1', v: ' ' }, { c: 'mtk10', v: 'true' }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: randomComment() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Markdown 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateMarkdownLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk7', v: '# ' }, { c: 'mtk7', v: randomComment() }],
      [{ c: 'mtk7', v: '## ' }, { c: 'mtk7', v: randomComment() }],
      [{ c: 'mtk7', v: '### ' }, { c: 'mtk7', v: randomComment() }],
      [{ c: 'mtk1', v: '- ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk1', v: '1. ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk5', v: '**' }, { c: 'mtk1', v: randomComment() }, { c: 'mtk5', v: '**' }],
      [{ c: 'mtk5', v: '*' }, { c: 'mtk1', v: randomComment() }, { c: 'mtk5', v: '*' }],
      [{ c: 'mtk5', v: '~~' }, { c: 'mtk1', v: randomComment() }, { c: 'mtk5', v: '~~' }],
      [{ c: 'mtk4', v: '> ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk1', v: '`' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '`' }],
      [{ c: 'mtk1', v: '``' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '``' }],
      [{ c: 'mtk5', v: '[' }, { c: 'mtk1', v: randomComment() }, { c: 'mtk5', v: '](' }, { c: 'mtk11', v: '#链接' }, { c: 'mtk5', v: ')' }],
      [{ c: 'mtk1', v: '![' }, { c: 'mtk1', v: randomComment() }, { c: 'mtk1', v: '](' }, { c: 'mtk11', v: '图片链接.jpg' }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '| ' }, { c: 'mtk1', v: randomComment() }, { c: 'mtk1', v: ' | ' }, { c: 'mtk1', v: randomComment() }, { c: 'mtk1', v: ' |' }],
      [{ c: 'mtk1', v: '|---|---|' }],
      [{ c: 'mtk1', v: '| ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ' | ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ' |' }],
      [{ c: 'mtk5', v: '- [ ] ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk5', v: '- [x] ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk5', v: '---' }],
      [{ c: 'mtk8', v: '```' }, { c: 'mtk9', v: 'javascript' }],
      [{ c: 'mtk9', v: 'const' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk8', v: '```' }],
      [{ c: 'mtk9', v: '@' }, { c: 'mtk1', v: '用户名' }],
      [{ c: 'mtk5', v: '#️⃣ ' }, { c: 'mtk1', v: '标题' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * LaTeX 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateTexLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk17', v: '\\documentclass' }, { c: 'mtk1', v: '[' }, { c: 'mtk11', v: '12pt' }, { c: 'mtk1', v: ']{' }, { c: 'mtk11', v: 'article' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\usepackage' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'amsmath' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\usepackage' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'graphicx' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\usepackage' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'geometry' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\title' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: randomComment() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\author' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: randomVariableName() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\date' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\begin' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'document' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\maketitle' }],
      [{ c: 'mtk17', v: '\\section' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: randomComment() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\subsection' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: randomComment() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk17', v: '\\begin' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'itemize' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\item' }, { c: 'mtk1', v: ' ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk17', v: '\\item' }, { c: 'mtk1', v: ' ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk17', v: '\\end' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'itemize' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\begin' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'enumerate' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\item' }, { c: 'mtk1', v: ' ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk17', v: '\\item' }, { c: 'mtk1', v: ' ' }, { c: 'mtk1', v: randomComment() }],
      [{ c: 'mtk17', v: '\\end' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'enumerate' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk1', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' + ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: '$' }],
      [{ c: 'mtk1', v: '\\[' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk17', v: '\\frac' }, { c: 'mtk1', v: '{' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '}{' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '}' }, { c: 'mtk1', v: '\\]' }],
      [{ c: 'mtk17', v: '\\begin' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'figure' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\includegraphics' }, { c: 'mtk1', v: '[' }, { c: 'mtk9', v: 'width=0.8\\textwidth' }, { c: 'mtk1', v: ']{' }, { c: 'mtk11', v: 'image.pdf' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\caption' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: randomComment() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\end' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'figure' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '\\end' }, { c: 'mtk1', v: '{' }, { c: 'mtk11', v: 'document' }, { c: 'mtk1', v: '}' }],
      [{ c: 'mt4', v: '% ' }, { c: 'mt4', v: randomComment() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * SQL 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateSqlLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'CREATE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'TABLE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' (' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'id' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'INT' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'PRIMARY' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'KEY' }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'VARCHAR' }, { c: 'mtk1', v: '(' }, { c: 'mtk10', v: '255' }, { c: 'mtk1', v: ') ' }, { c: 'mtk5', v: 'NOT' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'NULL' }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'TEXT' }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'DATETIME' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'DEFAULT' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: 'CURRENT_TIMESTAMP' }],
      [{ c: 'mtk1', v: ');' }],
      [{ c: 'mtk5', v: 'INSERT' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'INTO' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ', ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'VALUES' }, { c: 'mtk1', v: ' (' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk5', v: 'SELECT' }, { c: 'mtk1', v: ' * ' }, { c: 'mtk5', v: 'FROM' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk5', v: 'SELECT' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ', ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'FROM' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk5', v: 'SELECT' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'FROM' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'WHERE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'SELECT' }, { c: 'mtk1', v: ' * ' }, { c: 'mtk5', v: 'FROM' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'WHERE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'LIKE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: "'%value%'" }],
      [{ c: 'mtk5', v: 'SELECT' }, { c: 'mtk1', v: ' * ' }, { c: 'mtk5', v: 'FROM' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'WHERE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'IN' }, { c: 'mtk1', v: ' (' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'SELECT' }, { c: 'mtk1', v: ' * ' }, { c: 'mtk5', v: 'FROM' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'ORDER' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'BY' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }],
      [{ c: 'mtk5', v: 'UPDATE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'SET' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'WHERE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'DELETE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'FROM' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'WHERE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'CREATE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'INDEX' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'idx_' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'ON' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'DROP' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'TABLE' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'IF' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'EXISTS' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * PHP 代码生成器 - 返回带有高亮样式的对象数组
 */
const generatePhpLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk1', v: '<?php' }],
      [{ c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'private' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: '__construct' }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: '$this' }, { c: 'mtk1', v: '->' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$this' }, { c: 'mtk1', v: '->' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'elseif' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'echo' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'foreach' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'as' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'echo' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'try' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'catch' }, { c: 'mtk1', v: ' (' }, { c: 'mtk16', v: 'Exception' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: 'e' }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'echo' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: "'Error: '" }, { c: 'mtk1', v: ' . ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: 'e' }, { c: 'mtk1', v: '->' }, { c: 'mtk15', v: 'getMessage' }, { c: 'mtk1', v: '()' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk9', v: '$_POST' }, { c: 'mtk1', v: '[' }, { c: 'mtk11', v: "'" }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk11', v: "'" }, { c: 'mtk1', v: ']' }],
      [{ c: 'mtk9', v: '$_GET' }, { c: 'mtk1', v: '[' }, { c: 'mtk11', v: "'" }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk11', v: "'" }, { c: 'mtk1', v: ']' }],
      [{ c: 'mtk9', v: '$_SESSION' }, { c: 'mtk1', v: '[' }, { c: 'mtk11', v: "'" }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk11', v: "'" }, { c: 'mtk1', v: '] = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'require_once' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: "'" }, { c: 'mtk9', v: randomFileName() }, { c: 'mtk11', v: ".php'" }, { c: 'mtk1', v: ';' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Ruby 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateRubyLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'require' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: "'" }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk11', v: "'" }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'def' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: 'initialize' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: '@' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'end' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'def' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: '@' }, { c: 'mtk9', v: randomProperty() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'end' }],
      [{ c: 'mtk5', v: 'end' }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'def' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: 'end' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: 'end' }],
      [{ c: 'mtk5', v: 'unless' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: 'end' }],
      [{ c: 'mtk5', v: 'case' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'when' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'when' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: 'end' }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: ' {' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.each' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'do' }, { c: 'mtk1', v: ' |' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '|' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'puts' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: 'end' }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.map' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'do' }, { c: 'mtk1', v: ' |' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '|' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' * 2' }],
      [{ c: 'mtk1', v: 'end' }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'begin' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'rescue' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'StandardError' }, { c: 'mtk1', v: ' => ' }, { c: 'mtk9', v: 'e' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'puts' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: "'Error: #{e}'" }],
      [{ c: 'mtk5', v: 'end' }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk9', v: 'Array' }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: 'new' }, { c: 'mtk1', v: '(' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ') {' }, { c: 'mtk9', v: randomValue() }, { c: 'mtk1', v: '}' }],
      [{ c: 'mtk9', v: 'hash' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk1', v: '{' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: '}' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Rust 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateRustLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'use' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'std::collections::HashMap' }],
      [{ c: 'mtk5', v: 'use' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'std::io::{self, Read, Write}' }],
      [{ c: 'mtk5', v: 'use' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'std::fs::File' }],
      [{ c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '() -> ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'let' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'mut' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '<' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: '>(' }, { c: 'mtk9', v: 'param' }, { c: 'mtk1', v: ': T) -> T {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'param' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'struct' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomCppType() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'impl' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: 'new' }, { c: 'mtk1', v: '() -> Self {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk16', v: 'Self' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '    }' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(&self) -> ' }, { c: 'mtk16', v: randomCppType() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(&mut self) {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'self' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'enum' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomEnumName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomEnumValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomEnumValue() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'trait' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomInterfaceName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(&self);' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(&mut self);' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'impl' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomInterfaceName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'for' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(&self);' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'fn' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(&mut self);' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'match' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomValue() }, { c: 'mtk1', v: ' => ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomValue() }, { c: 'mtk1', v: ' => ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: '_' }, { c: 'mtk1', v: ' => ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'loop' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' += 1' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' > ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ' {' }, { c: 'mtk5', v: 'break' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'for' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'i' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'in' }, { c: 'mtk1', v: ' ' }, { c: 'mtk10', v: '0' }, { c: 'mtk1', v: '..' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'let' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'mut' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'sum' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: '0' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'sum' }, { c: 'mtk1', v: ' += ' }, { c: 'mtk9', v: 'i' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Rust工具链代码生成器 - 返回带有高亮样式的对象数组
 */
const generateRustToolchainLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk9', v: '[toolchain]' }],
      [{ c: 'mtk9', v: 'channel' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"stable"' }],
      [{ c: 'mtk9', v: 'components' }, { c: 'mtk1', v: ' = [' }, { c: 'mtk11', v: '"rustc"' }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: '"rust-std"' }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: '"cargo"' }, { c: 'mtk1', v: ']' }],
      [{ c: 'mtk9', v: 'profile' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"minimal"' }],
      [{ c: 'mtk9', v: 'targets' }, { c: 'mtk1', v: ' = [' }, { c: 'mtk11', v: '"x86_64-unknown-linux-gnu"' }, { c: 'mtk1', v: ']' }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: ' ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk9', v: '[source.crates-io]' }],
      [{ c: 'mtk9', v: 'replace-with' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"https://mirrors.ustc.edu.cn/crates.io-index"' }],
      [{ c: 'mtk9', v: '[source]' }],
      [{ c: 'mtk9', v: 'replace-with' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"https://mirrors.ustc.edu.cn/rust-static"' }],
      [{ c: 'mtk9', v: '[build]' }],
      [{ c: 'mtk9', v: 'rustflags' }, { c: 'mtk1', v: ' = ["-C", "target-cpu=native"]' }],
      [{ c: 'mtk9', v: '[target.x86_64-unknown-linux-gnu]' }],
      [{ c: 'mtk9', v: 'linker' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"ld.lld"' }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: ' ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk9', v: '[env]' }],
      [{ c: 'mtk9', v: 'CC_OVERRIDE' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"clang"' }],
      [{ c: 'mtk9', v: 'CXX_OVERRIDE' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"clang++"' }],
      [{ c: 'mtk9', v: '[target.' }, { c: 'mtk11', v: '"x86_64-unknown-linux-musl"' }, { c: 'mtk9', v: ']' }],
      [{ c: 'mtk9', v: 'linker' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"musl-gcc"' }],
      [{ c: 'mtk9', v: 'rustflags' }, { c: 'mtk1', v: ' = ["-C", "target-feature=+crt-static"]' }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: ' ' }, { c: 'mtk4', v: randomComment() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Swift 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateSwiftLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'Foundation' }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'UIKit' }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'SwiftUI' }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'Combine' }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: 'UIViewController' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'override' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'func' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: 'viewDidLoad' }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mt5', v: 'super' }, { c: 'mtk1', v: '.' }, { c: 'mt15', v: 'viewDidLoad' }, { c: 'mtk1', v: '()' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'setupUI' }, { c: 'mtk1', v: '()' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'private' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'func' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: 'setupUI' }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'view' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: 'backgroundColor' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk9', v: 'UIColor' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: 'systemBackground' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'struct' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: 'View' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'var' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: 'String' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'var' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'body' }, { c: 'mtk1', v: ': ' }, { c: 'mtk5', v: 'some' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: 'View' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'Text' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '      ' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: 'padding' }, { c: 'mtk1', v: '()' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'protocol' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomInterfaceName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'func' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '()' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'extension' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomInterfaceName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'func' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'enum' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomEnumName() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'case' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomEnumValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'case' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomEnumValue() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'let' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: 'String' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomString() }],
      [{ c: 'mtk5', v: 'var' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: 'Int' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk5', v: 'guard' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'let' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'for' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'in' }, { c: 'mtk1', v: ' ' }, { c: 'mtk10', v: '0' }, { c: 'mtk1', v: '...' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '}' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * TypeScript 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateTypeScriptLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'interface' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomInterfaceName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: '): ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'type' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomTypeName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ' | ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'const' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '<' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: '>(' }, { c: 'mtk9', v: 'param' }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: '): ' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'param' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '<' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: '> ' }, { c: 'mtk5', v: 'implements' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomInterfaceName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'private' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(): ' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'this' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'enum' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomEnumName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomEnumValue() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: `'${randomString().replace(/"/g, '')}'` }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomEnumValue() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: `'${randomString().replace(/"/g, '')}'` }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'type' }, { c: 'mtk1', v: ' { ' }, { c: 'mtk16', v: randomInterfaceName() }, { c: 'mtk1', v: ' } ' }, { c: 'mtk5', v: 'from' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `'${randomModuleName()}'` }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'export' }, { c: 'mtk1', v: ' { ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' }' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Python 代码生成器 - 返回带有高亮样式的对象数组
 */
const generatePythonLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomModuleName() }],
      [{ c: 'mtk5', v: 'from' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk5', v: 'def' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomPythonParameters() }, { c: 'mtk1', v: '):' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk11', v: '"""' }, { c: 'mtk11', v: randomComment() }, { c: 'mtk11', v: '"""' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'def' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: '__init__' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: 'self' }, { c: 'mtk1', v: ', ' }, { c: 'mtk9', v: randomPythonParameters() }, { c: 'mtk1', v: '):' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: 'self' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'def' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: 'self' }, { c: 'mtk1', v: '):' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'self' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'elif' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'pass' }],
      [{ c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk15', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'try' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'except' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: 'Exception' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'as' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'e' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk15', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: 'f"Error: {e}"' }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'for' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'in' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '()' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Java 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateJavaLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk5', v: 'package' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'com.' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'java.util.' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'import' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'java.io.' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'private' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomJavaParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'this' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: 'void' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomJavaParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'this' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk17', v: '@Override' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: 'String' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: 'toString' }, { c: 'mtk1', v: '() {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: '"Object: "' }, { c: 'mtk1', v: ' + ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: 'System' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: 'out' }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: 'println' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '();' }],
      [{ c: 'mtk1', v: '}' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * C++ 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateCppLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk17', v: '#include' }, { c: 'mtk1', v: ' <' }, { c: 'mtk11', v: randomHeaderName() }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk17', v: '#include' }, { c: 'mtk1', v: ' "' }, { c: 'mtk11', v: `${randomFileName()}.h"` }, { c: 'mtk1', v: '"' }],
      [{ c: 'mtk5', v: 'using' }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'namespace' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'std' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'class' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk5', v: 'private' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'public' }, { c: 'mtk1', v: ':' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '  ~' }, { c: 'mtk16', v: randomClassName() }, { c: 'mtk1', v: '();' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '();' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'void' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomCppParameters() }, { c: 'mtk1', v: ');' }],
      [{ c: 'mtk1', v: '};' }],
      [{ c: 'mtk16', v: randomCppType() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'cout' }, { c: 'mtk1', v: ' << ' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ' << ' }, { c: 'mtk9', v: 'endl' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '();' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk4', v: '// ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'for' }, { c: 'mtk1', v: ' (' }, { c: 'mtk5', v: 'int' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'i' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: '0' }, { c: 'mtk1', v: '; ' }, { c: 'mtk9', v: 'i' }, { c: 'mtk1', v: ' < ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: '; ' }, { c: 'mtk9', v: 'i' }, { c: 'mtk1', v: '++) {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '[' }, { c: 'mtk9', v: 'i' }, { c: 'mtk1', v: '] = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'template' }, { c: 'mtk1', v: ' <' }, { c: 'mtk5', v: 'typename' }, { c: 'mtk1', v: ' ' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: '>' }],
      [{ c: 'mtk16', v: 'T' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk16', v: 'T' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'param' }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'param' }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * CSS 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateCssLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: '#' }, { c: 'mtk13', v: randomVariableName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk4', v: '/* ' }, { c: 'mtk4', v: randomComment() }, { c: 'mtk4', v: ' */' }],
      [{ c: 'mtk17', v: '@media' }, { c: 'mtk1', v: ' (' }, { c: 'mtk14', v: 'max-width' }, { c: 'mtk1', v: ': ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: 'px) {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '  }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk17', v: '@keyframes' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk10', v: '0%' }, { c: 'mtk1', v: ' { ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: '; }' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk10', v: '100%' }, { c: 'mtk1', v: ' { ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: '; }' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: ':root' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: '--' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk12', v: '.' }, { c: 'mtk13', v: randomCssClass() }, { c: 'mtk12', v: ':hover' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk14', v: randomCssProperty() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomCssValue() }, { c: 'mtk1', v: ';' }],
      [{ c: 'mtk1', v: '}' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Lua 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateLuaLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk9', v: 'local' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'local' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk5', v: 'end' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'then' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'elseif' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'then' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'else' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'end' }],
      [{ c: 'mtk5', v: 'for' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: '1' }, { c: 'mtk1', v: ', ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'do' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'end' }],
      [{ c: 'mtk5', v: 'while' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'do' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'end' }],
      [{ c: 'mtk5', v: 'repeat' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'until' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }],
      [{ c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk5', v: 'require' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: `"${randomModuleName()}"` }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: '.' }, { c: 'mtk15', v: randomMethod() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'end' }],
      [{ c: 'mtk9', v: 'table' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ',' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk4', v: '-- ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: 'not' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'then' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: randomString() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk5', v: 'end' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * R 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateRLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' <- ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' <- c(' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' <- function(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomCondition() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' <- ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' <- ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'for' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'in' }, { c: 'mtk1', v: ' ' }, { c: 'mtk10', v: '1' }, { c: 'mtk1', v: ':' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk15', v: 'print' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk15', v: 'library' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: `"${randomModuleName()}"` }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'data' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'read.csv' }, { c: 'mtk1', v: '(' }, { c: 'mtk11', v: `"${randomFileName()}.csv"` }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'write.csv' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ', ' }, { c: 'mtk11', v: `"${randomFileName()}.csv"` }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'plot' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'hist' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'summary' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'mean' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'median' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'sd' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'lm' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ~ ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ', ' }, { c: 'mtk5', v: 'data' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk15', v: 'glm' }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ~ ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ', ' }, { c: 'mtk5', v: 'family' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"binomial"' }, { c: 'mtk1', v: ')' }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: randomComment() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * PowerShell 代码生成器 - 返回带有高亮样式的对象数组
 */
const generatePowerShellLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk5', v: 'function' }, { c: 'mtk1', v: ' ' }, { c: 'mtk15', v: randomFunctionName() }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'param' }, { c: 'mtk1', v: ' (' }],
      [{ c: 'mtk1', v: '    ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: '  )' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk5', v: 'return' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'if' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk5', v: 'else' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mt15', v: 'Write-Host' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: randomString() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'foreach' }, { c: 'mtk1', v: ' (' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk5', v: 'in' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ') {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mt15', v: 'Write-Host' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk5', v: 'try' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' = ' }, { c: 'mt11', v: 'Get-Content' }, { c: 'mtk1', v: ' -Path ' }, { c: 'mtk11', v: `"${randomFileName()}.txt"` }],
      [{ c: 'mtk1', v: '} ' }, { c: 'mtk5', v: 'catch' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mt15', v: 'Write-Error' }, { c: 'mtk1', v: ' ' }, { c: 'mt11', v: `"Error: $($_.Exception.Message)"` }],
      [{ c: 'mtk1', v: '}' }],
      [{ c: 'mtk15', v: 'Get-ChildItem' }, { c: 'mtk1', v: ' -Path ' }, { c: 'mtk11', v: `"${randomFileName()}"` }, { c: 'mtk1', v: ' -Recurse' }],
      [{ c: 'mtk15', v: 'Set-Content' }, { c: 'mtk1', v: ' -Path ' }, { c: 'mtk11', v: `"${randomFileName()}.txt"` }, { c: 'mtk1', v: ' -Value ' }, { c: 'mtk11', v: randomString() }],
      [{ c: 'mtk15', v: 'New-Item' }, { c: 'mtk1', v: ' -Path ' }, { c: 'mtk11', v: `"${randomFileName()}"` }, { c: 'mtk1', v: ' -ItemType Directory' }],
      [{ c: 'mtk15', v: 'Import-Module' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"${randomModuleName()}"` }],
      [{ c: 'mtk15', v: 'Export-Module' }, { c: 'mtk1', v: ' ' }, { c: 'mtk11', v: `"${randomModuleName()}"` }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' | ' }, { c: 'mt15', v: 'Where-Object' }, { c: 'mtk1', v: ' {' }, { c: 'mtk9', v: '$_' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' -eq ' }, { c: 'mtk11', v: randomValue() }, { c: 'mtk1', v: ' }' }],
      [{ c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' | ' }, { c: 'mt15', v: 'Select-Object' }, { c: 'mtk1', v: ' -Property ' }, { c: 'mtk9', v: randomProperty() }],
      [{ c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' | ' }, { c: 'mt15', v: 'Sort-Object' }, { c: 'mtk1', v: ' -Property ' }, { c: 'mtk9', v: randomProperty() }],
      [{ c: 'mtk9', v: '$' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' | ' }, { c: 'mt15', v: 'ForEach-Object' }, { c: 'mtk1', v: ' {' }],
      [{ c: 'mtk1', v: '  ' }, { c: 'mt15', v: 'Write-Host' }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: '$_' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }],
      [{ c: 'mtk1', v: '}' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * INI 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateIniLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk9', v: '[' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk9', v: ']' }],
      [{ c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: `"${randomString()}"` }],
      [{ c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: 'true' }],
      [{ c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: 'false' }],
      [{ c: 'mtk4', v: '; ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk9', v: '[' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk1', v: ' ' }, { c: 'mtk9', v: randomModuleName() }, { c: 'mtk9', v: ']' }],
      [{ c: 'mtk9', v: 'database' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk9', v: 'server' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk9', v: 'user' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk9', v: 'path' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: `"/path/to/${randomFileName()}"` }],
      [{ c: 'mtk9', v: 'logging' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: 'true' }],
      [{ c: 'mtk9', v: '[DEFAULT]' }],
      [{ c: 'mtk9', v: 'backup' }, { c: 'mtk1', v: '.' }, { c: 'mtk9', v: randomProperty() }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: `"${randomFileName()}.bak"` }],
      [{ c: 'mtk9', v: 'timezone' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"UTC"' }],
      [{ c: 'mtk9', v: 'encoding' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk11', v: '"utf-8"' }],
      [{ c: 'mtk9', v: 'max_connections' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk9', v: 'timeout' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }],
      [{ c: 'mtk9', v: 'retry_count' }, { c: 'mtk1', v: ' = ' }, { c: 'mtk10', v: randomNumber() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * 日志代码生成器 - 返回带有高亮样式的对象数组
 */
const generateLogLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk5', v: 'INFO' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk12', v: 'ERROR' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk13', v: 'WARN' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk16', v: 'DEBUG' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk5', v: 'INFO' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: '=' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk12', v: 'ERROR' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: randomFunctionName() }, { c: 'mtk1', v: '() failed: ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk13', v: 'WARN' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' is deprecated' }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk16', v: 'DEBUG' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: randomFunctionName() }, { c: 'mtk1', v: '(' }, { c: 'mtk9', v: randomParameters() }, { c: 'mtk1', v: ') called' }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk5', v: 'INFO' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: 'User ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ' logged in' }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk5', v: 'INFO' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: 'Request ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: ' processed in ' }, { c: 'mtk10', v: randomNumber() }, { c: 'mtk1', v: 'ms' }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk12', v: 'ERROR' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' not found' }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk13', v: 'WARN' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ' timed out' }],
      [{ c: 'mtk10', v: new Date().toISOString() }, { c: 'mtk1', v: ' [' }, { c: 'mtk16', v: 'DEBUG' }, { c: 'mtk1', v: '] ' }, { c: 'mtk9', v: randomVariableName() }, { c: 'mtk1', v: ': ' }, { c: 'mtk11', v: randomValue() }],
      [{ c: 'mtk1', v: '[' }, { c: 'mtk5', v: 'INFO' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk1', v: '[' }, { c: 'mtk12', v: 'ERROR' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk1', v: '[' }, { c: 'mtk13', v: 'WARN' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk1', v: '[' }, { c: 'mtk16', v: 'DEBUG' }, { c: 'mtk1', v: '] ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk10', v: new Date().toLocaleString() }, { c: 'mtk1', v: ' - ' }, { c: 'mtk5', v: 'INFO' }, { c: 'mtk1', v: ' - ' }, { c: 'mtk11', v: randomComment() }],
      [{ c: 'mtk10', v: new Date().toLocaleString() }, { c: 'mtk1', v: ' - ' }, { c: 'mtk12', v: 'ERROR' }, { c: 'mtk1', v: ' - ' }, { c: 'mtk11', v: randomComment() }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * Git 代码生成器 - 返回带有高亮样式的对象数组
 */
const generateGitLine = (fileType: string): { c: string; v: string }[] => {
  // prettier-ignore
  const patterns =
    [
      [{ c: 'mtk4', v: '# ' }, { c: 'mtk4', v: randomComment() }],
      [{ c: 'mtk1', v: '*.log' }],
      [{ c: 'mtk1', v: 'node_modules/' }],
      [{ c: 'mtk1', v: '.DS_Store' }],
      [{ c: 'mtk1', v: '*.tmp' }],
      [{ c: 'mtk1', v: 'dist/' }],
      [{ c: 'mtk1', v: 'build/' }],
      [{ c: 'mtk1', v: 'coverage/' }],
      [{ c: 'mtk1', v: '.env' }],
      [{ c: 'mtk1', v: '.env.local' }],
      [{ c: 'mtk1', v: '.env.*.local' }],
      [{ c: 'mtk1', v: '.vscode/settings.json' }],
      [{ c: 'mtk1', v: '*.swp' }],
      [{ c: 'mtk1', v: '*.swo' }],
      [{ c: 'mtk1', v: '*~' }],
      [{ c: 'mtk4', v: '# Editor directories and files' }],
      [{ c: 'mtk1', v: '.idea/' }],
      [{ c: 'mtk1', v: '.vscode/' }],
      [{ c: 'mtk1', v: '*.suo' }],
      [{ c: 'mtk1', v: '*.ntvs*' }],
      [{ c: 'mtk1', v: '*.njsproj' }],
      [{ c: 'mtk1', v: '*.sln' }],
      [{ c: 'mtk1', v: '*.sw?' }],
      [{ c: 'mtk4', v: '# OS generated files' }],
      [{ c: 'mtk1', v: '.DS_Store?' }],
      [{ c: 'mtk1', v: '.Thumbs.db' }],
      [{ c: 'mtk4', v: '# Dependency directories' }],
      [{ c: 'mtk1', v: 'node_modules/' }],
      [{ c: 'mtk1', v: 'jspm_packages/' }],
      [{ c: 'mtk1', v: 'bower_components/' }],
      [{ c: 'mtk4', v: '# Logs' }],
      [{ c: 'mtk1', v: 'logs' }],
      [{ c: 'mtk1', v: '*.log' }],
      [{ c: 'mtk1', v: 'npm-debug.log*' }],
      [{ c: 'mtk1', v: 'yarn-debug.log*' }],
      [{ c: 'mtk1', v: 'yarn-error.log*' }],
      [{ c: 'mtk4', v: '# Runtime data' }],
      [{ c: 'mtk1', v: 'pids' }],
      [{ c: 'mtk1', v: '*.pid' }],
      [{ c: 'mtk1', v: '*.seed' }],
      [{ c: 'mtk1', v: '*.pid.lock' }]
    ]
  return getNextPattern(fileType, patterns)
}

/**
 * 获取对应文件类型的代码生成器
 */
const getCodeGenerator = (fileType: string) => {
  switch (fileType) {
    case 'file_type_javascript.svg':
    case 'file_type_js.svg':
      return () => generateJavaScriptLine(fileType)
    case 'file_type_typescript.svg':
      return () => generateTypeScriptLine(fileType)
    case 'file_type_typescriptdef.svg':
      return () => generateTypeScriptDefLine(fileType)
    case 'file_type_python.svg':
      return () => generatePythonLine(fileType)
    case 'file_type_java.svg':
      return () => generateJavaLine(fileType)
    case 'file_type_cpp.svg':
      return () => generateCppLine(fileType)
    case 'file_type_cheader.svg':
      return () => generateCHeaderLine(fileType)
    case 'file_type_cppheader.svg':
      return () => generateCppHeaderLine(fileType)
    case 'file_type_csharp.svg':
      return () => generateCSharpLine(fileType)
    case 'file_type_css.svg':
      return () => generateCssLine(fileType)
    case 'file_type_scss.svg':
      return () => generateScssLine(fileType)
    case 'file_type_less.svg':
      return () => generateLessLine(fileType)
    case 'file_type_html.svg':
      return () => generateHtmlLine(fileType)
    case 'file_type_vue.svg':
      return () => generateVueLine(fileType)
    case 'file_type_json.svg':
      return () => generateJsonLine(fileType)
    case 'file_type_xml.svg':
      return () => generateXmlLine(fileType)
    case 'file_type_xsl.svg':
      return () => generateXslLine(fileType)
    case 'file_type_yaml.svg':
    case 'file_type_light_yaml.svg':
      return () => generateYamlLine(fileType)
    case 'file_type_markdown.svg':
      return () => generateMarkdownLine(fileType)
    case 'file_type_light_tex.svg':
      return () => generateTexLine(fileType)
    case 'file_type_sql.svg':
      return () => generateSqlLine(fileType)
    case 'file_type_php3.svg':
      return () => generatePhpLine(fileType)
    case 'file_type_ruby.svg':
      return () => generateRubyLine(fileType)
    case 'file_type_rust.svg':
      return () => generateRustLine(fileType)
    case 'file_type_rust_toolchain.svg':
      return () => generateRustToolchainLine(fileType)
    case 'file_type_swift.svg':
      return () => generateSwiftLine(fileType)
    case 'file_type_lua.svg':
      return () => generateLuaLine(fileType)
    case 'file_type_r.svg':
      return () => generateRLine(fileType)
    case 'file_type_powershell.svg':
      return () => generatePowerShellLine(fileType)
    case 'file_type_ini.svg':
      return () => generateIniLine(fileType)
    case 'file_type_log.svg':
      return () => generateLogLine(fileType)
    case 'file_type_git.svg':
      return () => generateGitLine(fileType)
    default:
      return () => generateJavaScriptLine(fileType)
  }
}
