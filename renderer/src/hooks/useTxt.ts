import JSZip from 'jszip'
import { type UploadFile } from 'element-plus'

/** 章节信息 */
interface Chapter {
  title: string
  content: string
}

/** EPUB 元数据 */
interface EpubMetadata {
  author: string
  title: string
  language: string
}

/**
 * XML/HTML 转义，防止特殊字符破坏 EPUB 结构
 */
const escapeXml = (text: string): string => {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

/**
 * 检测文本语言：中文为主返回 'zh'，否则 'en'
 */
const detectLanguage = (text: string): string => {
  // 取前 10000 个字符做样本
  const sample = text.slice(0, 10000)
  let cjkCount = 0
  let latinCount = 0
  for (const ch of sample) {
    const code = ch.charCodeAt(0)
    if ((code >= 0x4e00 && code <= 0x9fff) || (code >= 0x3400 && code <= 0x4dbf) || (code >= 0xf900 && code <= 0xfaff)) {
      cjkCount++
    } else if ((code >= 0x41 && code <= 0x5a) || (code >= 0x61 && code <= 0x7a)) {
      latinCount++
    }
  }
  return cjkCount > latinCount ? 'zh' : 'en'
}

/**
 * 检测文本中是否包含乱码字符
 * 通过检测常见的乱码特征（替换字符 U+FFFD 或连续的不可打印字符）来判断
 */
const hasGarbledText = (text: string): boolean => {
  if (!text || text.length === 0) return false

  // 检测 Unicode 替换字符（U+FFFD），TextDecoder 在遇到无法解码的字节时会输出此字符
  const replacementCharCount = (text.match(/\uFFFD/g) || []).length
  if (replacementCharCount > 3) return true

  // 检测是否包含大量连续的 C1 控制字符（0x80-0x9F 范围内的不可打印字符）
  // 这些字符在中文文本中通常不应出现
  let c1Count = 0
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    if (code >= 0x80 && code <= 0x9f) {
      c1Count++
    }
  }
  if (c1Count > 10) return true

  return false
}

/**
 * 检测文本编码并解码为字符串
 * 优先尝试 UTF-8，如果检测到乱码则尝试 GBK
 * @param buffer - 文件的二进制数据
 */
const decodeBuffer = (buffer: ArrayBuffer | Uint8Array): string => {
  const uint8 = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)

  // 检测 BOM
  if (uint8.length >= 3 && uint8[0] === 0xef && uint8[1] === 0xbb && uint8[2] === 0xbf) {
    return new TextDecoder('utf-8').decode(uint8)
  }
  if (uint8.length >= 2 && uint8[0] === 0xff && uint8[1] === 0xfe) {
    return new TextDecoder('utf-16le').decode(uint8)
  }
  if (uint8.length >= 2 && uint8[0] === 0xfe && uint8[1] === 0xff) {
    return new TextDecoder('utf-16be').decode(uint8)
  }

  // 尝试 UTF-8 解码
  const utf8Text = new TextDecoder('utf-8', { fatal: false }).decode(uint8)
  if (!hasGarbledText(utf8Text)) {
    return utf8Text
  }

  // UTF-8 乱码，尝试 GBK
  try {
    const gbkText = new TextDecoder('gbk', { fatal: false }).decode(uint8)
    if (!hasGarbledText(gbkText)) {
      return gbkText
    }
  } catch {
    // GBK 解码失败，忽略
  }

  // 都失败则返回 UTF-8 结果
  return utf8Text
}

/**
 * 从 URL 中提取文件名（不含路径和查询参数）
 */
const fileNameFromUrl = (url: string): string => {
  try {
    const pathname = new URL(url).pathname
    const decoded = decodeURIComponent(pathname)
    return decoded.split('/').pop() || 'unknown.txt'
  } catch {
    // 非标准 URL，直接取最后一段
    return url.split('/').pop()?.split('?')[0] || 'unknown.txt'
  }
}

/**
 * 从文件名中提取作者和标题
 * 支持格式：「作者 书名」「作者-书名」「《书名》」「书名-作者」
 * 同时尝试解析「作者 著」等常见模式
 * @param fileName - 文件名（含或不含 .txt 后缀）
 */
const parseEpubInfo = (fileName: string): EpubMetadata => {
  // 去掉 .txt 后缀
  const baseName = fileName.replace(/\.txt$/i, '').trim()
  let author = 'Unknown'
  let title = baseName

  // 1. 尝试解析「作者 - 书名」或「书名 - 作者」
  const dashParts = baseName.split(/\s*[-–—]\s*/)
  if (dashParts.length === 2) {
    // 如果第一部分以「著」「作」结尾，则第一部分是作者
    if (/[著作]$/.test(dashParts[0])) {
      author = dashParts[0].replace(/[著作]$/, '').trim()
      title = dashParts[1].trim()
    } else if (/[著作]$/.test(dashParts[1])) {
      title = dashParts[0].trim()
      author = dashParts[1].replace(/[著作]$/, '').trim()
    } else {
      // 默认：第一部分是作者，第二部分是书名
      author = dashParts[0].trim()
      title = dashParts[1].trim()
    }
    return { author, title, language: 'zh' }
  }

  // 2. 尝试解析「作者 书名」
  const spaceIdx = baseName.indexOf(' ')
  if (spaceIdx > 0) {
    author = baseName.slice(0, spaceIdx).trim()
    title = baseName.slice(spaceIdx + 1).trim()
    // 如果作者部分以「著」结尾，去掉
    author = author.replace(/[著作]$/, '').trim()
    return { author, title, language: 'zh' }
  }

  // 3. 单段：取书名
  return { author, title, language: 'zh' }
}

/**
 * 格式化文本，将每行非空内容包装为 <p> 标签
 */
const formatText = (text: string): string => {
  const lines = text.split('\n')
  const paragraphs: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed !== '') {
      paragraphs.push(`<p>${escapeXml(trimmed)}</p>`)
    }
  }

  return paragraphs.join('\n')
}

/**
 * 将文本按章节分割
 * @param content - 完整文本内容
 * @param title   - 默认标题（无法分割时使用）
 */
const getChapters = (content: string, title: string): Chapter[] => {
  const normalize = (s: string) => s.replace(/\r\n/g, '\n')
  let text = normalize(content)

  // 去掉 Project Gutenberg 的头尾（若存在）
  text = text.replace(/^[\s\S]*?\*\*\*\s*START OF( THE )?PROJECT GUTENBERG[\s\S]*?\*\*\*\s*/i, '')
  text = text.replace(/\*\*\*\s*END OF( THE )?PROJECT GUTENBERG[\s\S]*$/i, '')

  // 如有 "Contents" 或 "CONTENTS"，删除到第一个真实章节前（避免把目录当章节）
  text = text.replace(
    /^\s*contents[\s\S]{0,2000}?(?=^\s*(?:第[零一二三四五六七八九十百千万两0-9]+[回章卷节辑话篇部册]|楔子|前言|序[章言]|后记|尾声|(?:CHAPTER|Chapter|BOOK|Book|Part|Volume)\b|\d+\b[ \t]*[\.:\)]))/im,
    '',
  )

  // 章节行正则：支持中文、英文、数字等多种章节格式
  const chapterRegex =
    /^\s*(?:第[零一二三四五六七八九十百千万两0-9]+[回章卷节辑话篇部册]|楔子|前言|序[章言]|后记|尾声|引子|(?:CHAPTER|Chapter|BOOK|Book|Part|Volume)\s+(?:[IVXLCDM]+|\d+|[A-Za-z]+)|\d+\s*[\.:\)、．][ \t]*\S)[^\n]*$/gim

  const chapters: Chapter[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = chapterRegex.exec(text)) !== null) {
    const headingLine = match[0].trim()

    // 处理上一个章节的内容
    if (chapters.length > 0) {
      const prevEnd = match.index
      const chapterContent = text.slice(lastIndex, prevEnd).trim()
      if (chapterContent !== '') {
        // 有内容：追加到上一章
        chapters[chapters.length - 1].content += formatText(chapterContent)
      }
      // 无内容（连续标题）：不 pop 上一章，仅丢弃空段，保留上一章标题
    }

    chapters.push({ title: headingLine, content: '' })
    lastIndex = match.index + match[0].length
  }

  // 处理最后一章的内容
  if (chapters.length > 0) {
    const lastChapterContent = text.slice(lastIndex).trim()
    if (lastChapterContent !== '') {
      chapters[chapters.length - 1].content += formatText(lastChapterContent)
    }
  } else {
    // 无章节标题：按约 80 段切分为多章
    const lines = text.split('\n').filter((l) => l.trim() !== '')
    if (lines.length === 0) {
      chapters.push({ title, content: '' })
    } else if (lines.length <= 80) {
      chapters.push({ title, content: formatText(lines.join('\n')) })
    } else {
      const chunkSize = Math.ceil(lines.length / Math.ceil(lines.length / 80))
      for (let i = 0; i < lines.length; i += chunkSize) {
        const chunk = lines.slice(i, i + chunkSize).join('\n')
        const chunkTitle = `${title} (${Math.floor(i / chunkSize) + 1}/${Math.ceil(lines.length / chunkSize)})`
        chapters.push({ title: chunkTitle, content: formatText(chunk) })
      }
    }
  }

  return chapters
}

/**
 * 使用 JSZip 生成 EPUB 文件的 ArrayBuffer
 * @param chapters - 章节列表
 * @param metadata - 元信息
 */
const buildEpub = async (chapters: Chapter[], metadata: EpubMetadata): Promise<ArrayBuffer> => {
  const { author, title, language } = metadata

  const zip = new JSZip()

  // mimetype 必须是第一个文件且不压缩
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' })

  // META-INF/container.xml
  zip.folder('META-INF')!.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
  <rootfiles>
    <rootfile full-path="content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`,
  )

  // toc.ncx
  const navPoints = chapters
    .map((chapter, index) => {
      const id = `chapter${index + 1}`
      const playOrder = index + 1
      return `<navPoint id="navPoint-${id}" playOrder="${playOrder}">
  <navLabel>
    <text>${escapeXml(chapter.title)}</text>
  </navLabel>
  <content src="./OEBPS/${id}.xhtml" />
</navPoint>`
    })
    .join('\n')

  zip.file(
    'toc.ncx',
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="book-id" />
    <meta name="dtb:depth" content="1" />
    <meta name="dtb:totalPageCount" content="0" />
    <meta name="dtb:maxPageNumber" content="0" />
  </head>
  <docTitle>
    <text>${escapeXml(title)}</text>
  </docTitle>
  <docAuthor>
    <text>${escapeXml(author)}</text>
  </docAuthor>
  <navMap>
${navPoints}
  </navMap>
</ncx>`,
  )

  // content.opf
  const manifestItems: string[] = []
  manifestItems.push(`<item id="style" href="OEBPS/style.css" media-type="text/css"/>`)

  chapters.forEach((_, index) => {
    manifestItems.push(
      `<item id="chap${index + 1}" href="OEBPS/chapter${index + 1}.xhtml" media-type="application/xhtml+xml"/>`,
    )
  })
  const manifest = manifestItems.join('\n')

  const spine = chapters.map((_, index) => `<itemref idref="chap${index + 1}"/>`).join('\n')

  const tocManifest = `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`

  const bookId = `urn:uuid:${crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`}`

  zip.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:language>${language}</dc:language>
    <dc:creator>${escapeXml(author)}</dc:creator>
    <dc:identifier id="book-id">${bookId}</dc:identifier>
  </metadata>
  <manifest>
${manifest}
${tocManifest}
  </manifest>
  <spine toc="ncx">
${spine}
  </spine>
</package>`,
  )

  // style.css
  zip.folder('OEBPS')!.file(
    'style.css',
    `body { margin: 0; padding: 0; }
h1 { text-align: left; font-size: 1.5em; margin: 1em 0; }
h2 { text-align: left; font-size: 1.3em; margin: 0.8em 0; }
p { text-indent: 2em; margin: 0.5em 0; line-height: 1.6; }`,
  )

  // 章节内容 xhtml 文件
  const oebps = zip.folder('OEBPS')!
  chapters.forEach((chapter, index) => {
    oebps.file(
      `chapter${index + 1}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="${language}">
  <head>
    <title>${escapeXml(chapter.title)}</title>
    <link rel="stylesheet" type="text/css" href="../style.css"/>
  </head>
  <body>
    <h1>${escapeXml(chapter.title)}</h1>
${chapter.content}
  </body>
</html>`,
    )
  })

  // 生成 ArrayBuffer（浏览器端使用 arraybuffer 类型）
  return zip.generateAsync({ type: 'arraybuffer' })
}

/**
 * 将 TXT 转换为 EPUB 格式（浏览器端实现）
 *
 * @param input    - TXT 数据来源：
 *                   - `string`：远程或本地 URL，函数内部自动 fetch
 *                   - `UploadFile`：Element Plus 上传组件的文件对象
 * @param fileName - 文件名（用于提取作者和书名）；
 *                   当 input 为 URL 时可省略，将自动从 URL 路径中解析
 * @returns EPUB 文件的 ArrayBuffer
 */
export async function convertTxtToEpub(input: string | UploadFile, fileName?: string): Promise<File> {
  let txtBuffer: ArrayBuffer
  let resolvedFileName: string

  if (typeof input === 'string') {
    // URL 模式：自动 fetch
    const response = await fetch(input)
    if (!response.ok) {
      throw new Error(`获取 TXT 文件失败：${response.status} ${response.statusText}`)
    }
    txtBuffer = await response.arrayBuffer()
    resolvedFileName = fileName ?? fileNameFromUrl(input)
  } else {
    // UploadFile 模式：从 raw 属性获取 File 对象
    const file = input.raw!
    txtBuffer = await file.arrayBuffer()
    resolvedFileName = fileName ?? file.name
  }

  const metadata = parseEpubInfo(resolvedFileName)
  const txtContent = decodeBuffer(txtBuffer)

  // 根据文本内容检测语言，覆盖文件名解析的默认值
  metadata.language = detectLanguage(txtContent)

  const chapters = getChapters(txtContent, metadata.title)

  // 构建 EPUB 并直接包装成 File 对象
  const epubData = await buildEpub(chapters, metadata)
  const epubFile = new File([epubData], resolvedFileName.replace(/\.[^/.]+$/, '.epub'), {
    type: 'application/epub+zip',
  })

  return epubFile
}
