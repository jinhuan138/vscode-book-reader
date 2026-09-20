import useStore from './useStore'
import { rendition, onReady } from './useRendition'

const { bookInfo } = useStore()

export interface Bookmark {
  label: string
  cfi: string
  href?: string
}
export interface Highlight {
  value: string
  type?: string
  color?: string
  /** Selected text. */
  quote: string
  /** User-authored note. */
  note: string
  createdAt?: number
  updatedAt?: number
}
export interface BookInfo {
  id: string
  lastLocation: string | number | undefined
  bookmarks: Bookmark[]
  highlights: Highlight[]
  title?: string
  cover?: string
}

onReady(async () => {
  const { book } = rendition.value
  bookInfo.value = { ...bookInfo.value, ...book.metadata }
  book.getCover?.().then(async (blob: Blob) => {
    if(!blob) return
    const cover = URL.createObjectURL(blob)
    bookInfo.value!.cover = cover
  })
  rendition.value.addEventListener('relocate', (event: any) => {
    bookInfo.value!.lastLocation = event.detail.cfi
  })
})
export default function useInfo() {
  return bookInfo
}
