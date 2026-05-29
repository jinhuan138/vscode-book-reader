import { type UploadFile } from 'element-plus'
import { useLocalStorage } from '@vueuse/core'
import { ref } from 'vue'
import { type BookInfo } from './useInfo'
import { rendition } from './useRendition'
import useVscode from '@/hooks/useVscode'
import { convertTxtToEpub } from '@/hooks/useTxt'
//TODO https://vueuse.org/integrations/useIDBKeyval/#useidbkeyval

const vscode = useVscode()
const bookKey = ref<null | string>(null)
const url = ref<null | UploadFile['raw'] | File | string>(null)
const bookList = useLocalStorage<BookInfo[]>('bookListInfo', [])

const removeBook = (id: string) => {
  const index = bookList.value.findIndex((item: BookInfo) => item.id === id)
  if (index > -1) {
    bookList.value.splice(index, 1)
  }
}

async function getMd5(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const closeBook = () => {
  rendition.value?.close()
  bookKey.value = null
  url.value = null
  rendition.value = null
  vscode?.postMessage({ type: 'title', content: '' })
}

const isTxt = (file: UploadFile | string) => {
  const name = typeof file === 'string' ? file : file.name
  return name.toLowerCase().endsWith('.txt')
}
const addBook = async (book: UploadFile | string) => {
  closeBook()
  let file: File
  if (typeof book === 'string') {
    file = await fetch(book).then(async (res) => new File([await res.blob()], new URL(res.url).pathname))
  } else {
    file = book.raw!
  }
  const id = await getMd5(file)
  if (isTxt(book)) {
    url.value = await convertTxtToEpub(book)
  } else {
    url.value = typeof book === 'string' ? book : book.raw!
  }
  bookKey.value = id
  const existingBook = bookList.value.find((item: BookInfo) => item.id === id)
  if (!existingBook) {
    bookList.value.push({
      id,
      lastLocation: 0,
      bookmarks: [],
      highlights: [],
    })
  }
}
// addBook('/files/啼笑因缘.txt')
export default function useStore() {
  return { url, bookKey, bookList, addBook, removeBook, closeBook }
}
