import { type UploadFile } from 'element-plus'
import { useLocalStorage } from '@vueuse/core'
import { ref } from 'vue'
import { type BookInfo } from './useInfo'
import { rendition } from './useRendition'
import useVscode from '@/hooks/useVscode'
import { convertTxtBufferToEpub } from '@/hooks/useTxt'
import { preparePdfWorker } from '@/hooks/usePdfWorker'
//TODO https://vueuse.org/integrations/useIDBKeyval/#useidbkeyval

const vscode = useVscode()
const bookKey = ref<null | string>(null)
const url = ref<null | UploadFile['raw'] | File | string>(null)
const bookList = useLocalStorage<BookInfo[]>('bookListInfo', [])
let openRequestId = 0
let fetchController: AbortController | null = null
type BookSource = UploadFile | File | string

const removeBook = (id: string) => {
  const index = bookList.value.findIndex((item: BookInfo) => item.id === id)
  if (index > -1) {
    bookList.value.splice(index, 1)
  }
}

async function getSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const resetBook = () => {
  try {
    rendition.value?.close()
  } catch (e) {
    console.warn('rendition close failed', e)
  }
  bookKey.value = null
  url.value = null
  rendition.value = null
  vscode?.postMessage({ type: 'title', content: '' })
}

const closeBook = () => {
  openRequestId++
  fetchController?.abort()
  fetchController = null
  resetBook()
}

const isTxt = (file: BookSource) => {
  const name = typeof file === 'string' ? file : file.name
  return name.toLowerCase().endsWith('.txt')
}

const isPdf = (file: BookSource) => {
  const name = typeof file === 'string' ? file.split(/[?#]/)[0] : file.name
  return name.toLowerCase().endsWith('.pdf')
}

const getFileName = (source: string, responseUrl: string): string => {
  try {
    const pathname = new URL(responseUrl || source, window.location.href).pathname
    return decodeURIComponent(pathname.split('/').pop() || 'book')
  } catch {
    return source.split('/').pop()?.split('?')[0] || 'book'
  }
}

const addBook = async (book: BookSource) => {
  const requestId = ++openRequestId
  fetchController?.abort()
  resetBook()

  const controller = new AbortController()
  fetchController = controller

  // worker 与书籍内容并行加载，别串在整本书读完之后；失败只降级不阻断开书
  const pdfWorkerPromise = isPdf(book)
    ? preparePdfWorker().catch((e) => console.warn('pdf worker prepare failed', e))
    : Promise.resolve()

  try {
    let file: File
    if (typeof book === 'string') {
      const response = await fetch(book, { signal: controller.signal })
      if (!response.ok) {
        throw new Error(`Failed to load book: ${response.status} ${response.statusText}`)
      }
      const blob = await response.blob()
      file = new File([blob], getFileName(book, response.url), { type: blob.type })
    } else if (book instanceof File) {
      file = book
    } else {
      if (!book.raw) throw new Error('The selected book has no file data')
      file = book.raw
    }
    if (requestId !== openRequestId) return

    // Read once; reuse the same bytes for identity and TXT conversion.
    const sourceBuffer = await file.arrayBuffer()
    if (requestId !== openRequestId) return

    const hashPromise = getSha256(sourceBuffer)
    const preparedBookPromise = isTxt(file.name)
      ? convertTxtBufferToEpub(sourceBuffer, file.name)
      : Promise.resolve(file)
    const [id, preparedBook] = await Promise.all([hashPromise, preparedBookPromise, pdfWorkerPromise])

    // A newer open/close action owns the state; discard this stale result.
    if (requestId !== openRequestId) return

    url.value = preparedBook
    bookKey.value = id
    const existingBook = bookList.value.find((item: BookInfo) => item.id === id)
    if (!existingBook) {
      bookList.value.push({
        id,
        lastLocation: undefined,
        bookmarks: [],
        highlights: [],
      })
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    throw error
  } finally {
    if (requestId === openRequestId) fetchController = null
  }
}
// addBook('/files/征服市场的人：西蒙斯传.epub')
export default function useStore() {
  return { url, bookKey, bookList, addBook, removeBook, closeBook }
}
