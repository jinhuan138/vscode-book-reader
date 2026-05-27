import { computed } from 'vue'
import useStore from './useStore'
import { rendition, onReady } from './useRendition'
import useVscode from './useVscode'

const vscode = useVscode()
const { bookList, bookKey } = useStore()

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
export interface BookInfo {
  id: string
  lastLocation: string | number
  bookmarks: Bookmark[]
  highlights: Highlight[]
  title?: string
  cover?: string
}

onReady(async () => {
  const { book } = rendition.value
  if (book.metadata.title) {
    vscode?.postMessage({
      type: 'title',
      content: book.metadata.title,
    })
  }
  bookInfo.value = { ...bookInfo.value, ...book.metadata }
  book.getCover?.().then(async (blob: Blob) => {
    const cover = URL.createObjectURL(blob)
    bookInfo.value!.cover = cover
  })
  rendition.value.addEventListener('relocate', (event: any) => {
    bookInfo.value!.lastLocation = event.detail.cfi
  })
})
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
export default function useInfo() {
  return bookInfo
}
