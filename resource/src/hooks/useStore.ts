/// <reference types="vite/client" />
import { useLocalStorage } from '@vueuse/core'
import { ref, watch } from 'vue'
import { type BookInfo } from './useInfo.ts'
//TODO https://vueuse.org/integrations/useIDBKeyval/#useidbkeyval
import { createInstance } from 'localforage'
import { dayjs, type UploadFile } from 'element-plus'
import { getColorSync } from 'colorthief'
interface BookFileData {
  file: Blob
  cover: Blob
}
const bookFile = createInstance({
  name: 'bookFileList',
})
const bookKey = ref<null | string>(null)
const url = ref<null | Blob>(null)
watch(
  bookKey,
  async (newKey) => {
    if (newKey) {
      try {
        const item = await bookFile.getItem<BookFileData>(newKey)
        url.value = item?.file ?? null
      } catch (error) {
        console.error('Failed to get book file:', error)
        url.value = null
      }
    } else {
      url.value = null
    }
  },
  { immediate: true },
)

const bookList = useLocalStorage<BookInfo[]>('bookListInfo', [])
const coverUrls = ref<Record<string, string>>({})

const getCoverById = async (id: string): Promise<Blob | null> => {
  try {
    const item = await bookFile.getItem<{ cover?: Blob }>(id)
    return item?.cover || null
  } catch (error) {
    console.error('Failed to get cover:', error)
    return null
  }
}

watch(
  () => bookList.value.length,
  async (newLength, oldLength) => {
    if (oldLength && newLength < oldLength) return
    for (const book of bookList.value) {
      if (!coverUrls.value[book.id]) {
        const blob = await getCoverById(book.id)
        if (blob) {
          coverUrls.value[book.id] = URL.createObjectURL(blob)
        }
      }
    }
  },
  { immediate: true },
)

async function getMd5(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}
const getBookInfo = async (file) => {
  const view = document.createElement('foliate-view') as any
  let info = null
  await view.open(file)
  const { book } = view
  info = book.metadata
  const coverBlob = await book.getCover?.()
  info.color = await getColorFromUrl(coverBlob!)
  info.cover = coverBlob
  return info
}
const getColorFromUrl = async (blob: Blob): Promise<string | null> => {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = URL.createObjectURL(blob)
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    })
    return getColorSync(img)!.hex()
  } catch (error) {
    console.error('Error getting color from URL:', error)
    return null
  }
}
const addBook = async (book: UploadFile | string) => {
  let file: File
  if (typeof book === 'string') {
    file = await fetch(book).then(async (res) => new File([await res.blob()], new URL(res.url).pathname))
  } else {
    file = book.raw!
  }
  const md5 = await getMd5(file)
  const existingBook = bookList.value.find((item) => item.md5 === md5)
  if (existingBook) {
    return existingBook.id
  } else {
    const bookInfo = await getBookInfo(file)
    const { cover, ...info } = bookInfo
    const id = crypto.randomUUID()
    await bookFile.setItem(id, {
      file,
      cover,
    })
    bookList.value.push({
      id,
      lastOpen: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      cfi: 0,
      md5,
      size: file.size,
      bookmarks: [],
      highlights: [],
      ...info,
    })
    return id
  }
}

const removeBook = (id: string) => {
  bookFile.removeItem(id)
  const index = bookList.value.findIndex((item) => item.id === id)
  if (index > -1) {
    bookList.value.splice(index, 1)
  }
}

export default function useStore() {
  return { url, bookKey, bookList, coverUrls, addBook, removeBook }
}
