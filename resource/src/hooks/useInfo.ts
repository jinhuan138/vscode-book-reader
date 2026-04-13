import useStore from '@/hooks/useStore'
import { getColorSync, Color } from 'colorthief'
import { ref } from 'vue'
import useVscode from './useVscode'
import { rendition, isEpub, onReady } from './useRendition'
const vscode = useVscode()
const { bookInfo } = useStore()

const postMessage = (title: string) => {
  if (vscode) {
    vscode.postMessage({
      type: 'title',
      content: title,
    })
  }
}
const getColorFromUrl = async (url: string): Promise<Color | null> => {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'Anonymous'
      img.src = url
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    })
    return getColorSync(img)
  } catch (error) {
    console.error('Error getting color from URL:', error)
    return null
  }
}

export default function useInfo() {
  const information = ref<any>(null)
  onReady(() => {
    if (isEpub()) {
      const { book } = rendition.value
      book.ready.then(() => {
        book.loaded.metadata.then(async (metadata: any) => {
          const cover = await book.coverUrl()
          information.value = { ...metadata, cover }
          information.value.color = await getColorFromUrl(cover)
          bookInfo.value!.title = metadata?.title || ''
          postMessage(metadata?.title || '')
        })
      })
    } else {
      const { book } = rendition.value
      information.value = book.metadata
      book.getCover?.().then(async (blob: Blob) => {
        const cover = URL.createObjectURL(blob)
        information.value.cover = cover
        information.value.color = await getColorFromUrl(cover)
      })
      const bookTitle = book.metadata?.title || ''
      bookInfo.value!.title = bookTitle
      postMessage(bookTitle)
    }
  })
  return information
}
