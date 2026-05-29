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
 * 支持格式：「作者 书名」「作者-书名」「书名」
 * @param fileName - 文件名（含或不含 .txt 后缀）
 */
const parseEpubInfo = (fileName: string): EpubMetadata => {
  // 去掉 .txt 后缀
  const baseName = fileName.replace(/\.txt$/i, '')
  // 按第一个空格或者 - 分割文件名
  const splitRegex = /[ \-]/
  const parts = baseName.split(splitRegex, 2)
  let author = 'Unknown'
  let title = baseName
  if (parts.length === 2) {
    author = parts[0]
    title = parts[1]
  }
  return { author, title }
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
      paragraphs.push(`<p>${trimmed}</p>`)
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
  const chapterRegex =
    /^\s*([第卷][一二三四五六七八九十0-9]+[章卷节辑话篇]).*|^\s*(楔子|引言|序章|声明|后记|后序|前言)(?::[^\n]*)?$/gm
  const chapters: Chapter[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = chapterRegex.exec(content)) !== null) {
    if (chapters.length > 0) {
      const prevChapterEnd = match.index
      let chapterContent = content.slice(lastIndex, prevChapterEnd)
      chapterContent = formatText(chapterContent)
      // 若 chapterContent 为空，则跳过本次循环
      if (chapterContent === '') {
        chapters.pop()
        continue
      }
      chapters[chapters.length - 1].content += chapterContent
    }

    const trimmedTitle = match[0].trim()
    chapters.push({ title: trimmedTitle, content: '' })
    lastIndex = match.index + match[0].length
  }

  if (chapters.length > 0) {
    let lastChapterContent = content.slice(lastIndex)
    lastChapterContent = formatText(lastChapterContent)
    chapters[chapters.length - 1].content += lastChapterContent
  } else {
    // 无法分割，就全部生成一个 html 文件
    chapters.push({ title, content: formatText(content) })
  }

  return chapters
}

/**
 * 使用 JSZip 生成 EPUB 文件的 ArrayBuffer
 * @param chapters - 章节列表
 * @param metadata - 元信息
 */
const buildEpub = async (chapters: Chapter[], metadata: EpubMetadata): Promise<ArrayBuffer> => {
  const { author, title } = metadata

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
      const playOrder = index + 2 // 封页的 playOrder 为 1
      return `<navPoint id="navPoint-${id}" playOrder="${playOrder}">
  <navLabel>
    <text>${chapter.title}</text>
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
    <text>${title}</text>
  </docTitle>
  <docAuthor>
    <text>${author}</text>
  </docAuthor>
  <navMap>
${navPoints}
  </navMap>
</ncx>`,
  )

  // content.opf
  const manifest = chapters
    .map(
      (_, index) =>
        `<item id="chap${index + 1}" href="OEBPS/chapter${index + 1}.xhtml" media-type="application/xhtml+xml"/>`,
    )
    .join('\n')

  const spine = chapters.map((_, index) => `<itemref idref="chap${index + 1}"/>`).join('\n')

  const tocManifest = `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>`

  zip.file(
    'content.opf',
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="book-id" version="2.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:title>${title}</dc:title>
    <dc:language>zh</dc:language>
    <dc:creator>${author}</dc:creator>
    <dc:identifier id="book-id">${Date.now()}</dc:identifier>
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

  // 章节内容 xhtml 文件
  const oebps = zip.folder('OEBPS')!
  chapters.forEach((chapter, index) => {
    oebps.file(
      `chapter${index + 1}.xhtml`,
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" lang="zh">
  <head>
    <title>${chapter.title}</title>
    <link rel="stylesheet" type="text/css" href="../style.css"/>
  </head>
  <body>
    <h1>${chapter.title}</h1>
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

  const { author, title } = parseEpubInfo(resolvedFileName)
  const txtContent = decodeBuffer(txtBuffer)
  const chapters = getChapters(txtContent, title)

  // 构建 EPUB 并直接包装成 File 对象
  const epubData = await buildEpub(chapters, { author, title })
  const epubFile = new File([epubData], resolvedFileName.replace(/\.[^/.]+$/, '.epub'), {
    type: 'application/epub+zip',
  })

  return epubFile
}
