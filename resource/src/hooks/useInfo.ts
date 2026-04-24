import { computed } from 'vue'
import useStore from './useStore'
import { rendition, onReady } from './useRendition'
import { dayjs } from 'element-plus'
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
  md5: string
  lastLocation: string | number
  lastOpen: string
  size: number
  fileType: string
  bookmarks: Bookmark[]
  highlights: Highlight[]
  title: string
  color: string
}

onReady(async () => {
  rendition.value.addEventListener('relocate', (event: any) => {
    bookInfo.value!.lastLocation = event.detail.cfi
    bookInfo.value!.lastOpen = dayjs().format('YYYY-MM-DD HH:mm:ss')
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
