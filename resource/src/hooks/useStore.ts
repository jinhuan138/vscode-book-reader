/// <reference types="vite/client" />
import { useLocalStorage } from '@vueuse/core'
import { ref, watch, computed, onBeforeUnmount } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'
const defaultBook = 'files/alice.epub' //啼笑因缘.azw3
const url = ref<File | string>(import.meta.env.MODE === 'development' ? defaultBook : '')
const bookKey = ref('')

interface BookInfoItem {
  key: string
  fileType: string
  title: string
  cfi: string | number
  bookmarks: any[]
}
const bookList = useLocalStorage<BookInfoItem[]>('bookListInfo', [])

const bookInfo = computed<BookInfoItem | null>({
  get: () => {
    if (!bookKey.value) return null
    return bookList.value.find((item) => item.key === bookKey.value) || null
  },
  set: (info) => {
    if (!bookKey.value) return
    const index = bookList.value.findIndex((item) => item.key === bookKey.value)
    if (index > -1) {
      bookList.value[index] = info!
    }
  },
})

const hashFile = async (file: File | string): Promise<string> => {
  let buffer: ArrayBuffer

  if (typeof file === 'string') {
    // URL 字符串：先 fetch 获取数据
    const response = await fetch(file)
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${file}`)
    }
    buffer = await response.arrayBuffer()
  } else {
    // File 对象：直接获取 arrayBuffer
    buffer = await file.arrayBuffer()
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

watch(
  url,
  async (u) => {
    if (!u) return
    bookKey.value = await hashFile(u)
    if (!bookList.value.find((item) => item.key === bookKey.value)) {
      const pathName = typeof u === 'string' ? u : u.name
      bookList.value.push({
        key: bookKey.value,
        title: '',
        fileType: pathName.split('.').pop()!.toLowerCase(),
        cfi: 0,
        bookmarks: [],
      })
    }
  },
  { immediate: true },
)

const onRelocate = (event: any) => {
  bookInfo.value!.cfi = event.detail.cfi
}
onReady(() => {
  if (isEpub()) {
    rendition.value.on('relocated', (event: any) => {
      bookInfo.value!.cfi = event.start.cfi
    })
    rendition.value.display(bookInfo.value!.cfi || 0)
  } else {
    rendition.value?.goTo(bookInfo.value!.cfi || 0)
    rendition.value.addEventListener('relocate', onRelocate)
  }
})

onBeforeUnmount(() => {
  if (!isEpub()) {
    rendition.value.removeEventListener('relocate', onRelocate)
  }
})

export default function useStore() {
  return { url, bookKey, bookInfo }
}
