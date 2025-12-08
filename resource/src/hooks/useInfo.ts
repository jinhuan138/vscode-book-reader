import ColorThief from 'colorthief'
import { ref, watch } from 'vue'
import useVscode from './useVscode'
import useRendition from './useRendition'
const vscode = useVscode()

const [rendition] = useRendition()
const colorThief = new ColorThief()

const rgbToHex = (r: number, g: number, b: number): string =>
  '#' +
  [r, g, b]
    .map((x) => {
      const hex = x.toString(16)
      return hex.length === 1 ? '0' + hex : hex
    })
    .join('')

rgbToHex(102, 51, 153) // #663399

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
  watch(rendition, (instance) => {
    if (!instance.shadowRoot) {
      const { book } = instance
      book.ready.then(() => {
        book.loaded.metadata.then(async (metadata) => {
          const cover = await book.coverUrl()
          information.value = { ...metadata, cover }
          information.value.color = await getCoverColor(cover)
          postMessage(metadata?.title || '')
        })
      })
    } else {
      const { book } = instance
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
