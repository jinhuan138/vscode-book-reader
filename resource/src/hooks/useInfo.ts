import ColorThief from 'colorthief'
import { ref } from 'vue'
import useVscode from './useVscode'
import { rendition, isEpub, onReady } from './useRendition'
const vscode = useVscode()

const colorThief = new ColorThief()

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' +
  [r, g, b]
    .map((x) => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    })
    .join('')

const getCoverColor = (src: string): Promise<string> => {
  return new Promise((resolve) => {
    const img = document.createElement('img')
    img.crossOrigin = 'Anonymous' // 防止跨域问题
    img.src = src

    if (img.complete) {
      const rgb = colorThief.getColor(img) as [number, number, number]
      resolve(rgbToHex(...rgb))
    } else {
      img.addEventListener(
        'load',
        () => {
          const rgb = colorThief.getColor(img) as [number, number, number]
          resolve(rgbToHex(...rgb))
        },
        { once: true },
      )
    }
  })
}

const postMessage = (title: string) => {
  if (vscode) {
    vscode.postMessage({
      type: 'title',
      content: title,
    })
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
          information.value.color = await getCoverColor(cover)
          postMessage(metadata?.title || '')
        })
      })
    } else {
      const { book } = rendition.value
      information.value = book.metadata
      book.getCover?.().then(async (blob: Blob) => {
        const cover = URL.createObjectURL(blob)
        information.value.cover = cover
        information.value.color = await getCoverColor(cover)
      })
      const bookName = book.metadata?.title || ''
      postMessage(bookName)
    }
  })
  return information
}
