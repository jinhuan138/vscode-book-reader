/// <reference types="vite/client" />
import { useLocalStorage } from '@vueuse/core'
import { ref, computed, onBeforeUnmount } from 'vue'
import { rendition, onReady } from './useRendition.ts'
import { createInstance } from 'localforage'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
const bookFile = createInstance({
  name: 'bookFileList',
})
export interface Bookmark {
  label: string
  cfi: string
  href?: string
}

export interface Highlight {
  value: string
  type?: string
  color?: string
  note: string
}
const bookKey = ref<null | string>(null)

const url = computed(async () => {
  if (bookKey.value) return await bookFile.getItem(bookKey.value).file
  else return null
})

export interface BookInfo {
  id: string
  lastOpen: number
  size: number
  fileType: string
  bookmarks: Bookmark[]
  highlights: Highlight[]
  title?: string
  cover?: string
  color?: string
  cfi?: string | number
}
const bookList = useLocalStorage<BookInfo[]>('bookListInfo', [])

const bookInfo = computed<BookInfo | null>({
  get: () => {
    if (!bookKey.value) return null
    return bookList.value.find((item) => item.id === bookKey.value) || null
  },
  set: (info) => {
    if (!bookKey.value) return
    const index = bookList.value.findIndex((item) => item.id === bookKey.value)
    if (index > -1) {
      bookList.value[index] = info!
    }
  },
})

async function generateBookId(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const addBook = async (book: UploadFile | string) => {
  let bookId: string
  let file: File | Blob | null = null
  let size: number = 0
  let type: string = ''

  if (typeof book === 'string') {
    try {
      const response = await fetch(book)
      size = Number(response.headers.get('content-length'))
      const lastDotIndex = book.lastIndexOf('.')
      type = lastDotIndex > -1 ? book.substring(lastDotIndex + 1).toLowerCase() : ''
      file = await response.blob()
      bookId = await generateBookId(file)
    } catch (error) {
      ElMessage.error('Failed to add book: ' + (error as Error).message)
      return
    }
  } else {
    file = book.raw!
    bookId = await generateBookId(file)
    size = file.size
    type = book.name.split('.').pop()?.toLowerCase() || ''
  }
  const existingBook = bookList.value.find((item) => item.id === bookId)

  if (existingBook) {
    bookKey.value = bookId
  } else {
    bookKey.value = bookId
    await bookFile.setItem(bookId, {
      file: bookFile,
    })
    bookList.value.push({
      id: bookId,
      lastOpen: Date.now(),
      size,
      fileType: type,
      bookmarks: [],
      highlights: [],
    })
  }
}

const removeBook = (id: string) => {
  bookFile.removeItem(id)
  const index = bookList.value.findIndex((item) => item.id === id)
  if (index > -1) {
    bookList.value.splice(index, 1)
  }
}

const onRelocate = (event: any) => {
  bookInfo.value!.cfi = event.detail.cfi
}
onReady(() => {
  rendition.value?.goTo(bookInfo.value!.cfi || 0)
  rendition.value.addEventListener('relocate', onRelocate)
})

onBeforeUnmount(() => {
  rendition.value.removeEventListener('relocate', onRelocate)
})

export default function useStore() {
  return { url, bookKey, bookList, bookInfo, addBook, removeBook }
}
