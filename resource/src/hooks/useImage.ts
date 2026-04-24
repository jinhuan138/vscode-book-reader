import { ref, computed, watch } from 'vue'
import useVscode from './useVscode'
import { rendition, onReady } from './useRendition'
import { useLocalStorage } from '@vueuse/core'

const vscode = useVscode()
const imageUrlToUint8Array = async (url: string) => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const blob = await response.blob()
    const fileReader = new FileReader()
    return new Promise((resolve, reject) => {
      fileReader.onloadend = (e) => {
        resolve(new Uint8Array(e.target!.result as ArrayBuffer))
      }
      fileReader.onerror = (err) => {
        reject(err)
      }
      fileReader.readAsArrayBuffer(blob)
    })
  } catch (error) {
    console.error('Error converting image URL to Uint8Array:', error)
    throw error
  }
}

export default function useImage() {
  const srcList = computed(() => imageList.value.map((img) => img.src || (img.getAttribute('xlink:href') as string)))
  const imageList = ref<HTMLImageElement[]>([])
  const indexRef = ref<number>(0)
  const showPreview = ref<boolean>(false)
  const imageDisplayModeOptions = ['Normal', 'Mini', 'Hide']
  const imageDisplayMode = useLocalStorage<'Normal' | 'Mini' | 'Hide'>('imageDisplayMode', 'Normal')
  const miniMediaScale = useLocalStorage<number>('miniMediaScale', 100)
  const downloadImage = (index: number) => {
    if (vscode) {
      imageUrlToUint8Array(srcList.value[index]).then((data) => {
        vscode.postMessage({
          type: 'download',
          content: data,
        })
      })
    } else {
      var downloadLink = document.createElement('a')
      downloadLink.href = srcList.value[index]
      downloadLink.download = Date.now() + '.jpg'
      downloadLink.style.display = 'none'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }

  const initImage = () => {
    imageList.value.forEach((img, index) => {
      img.title = '点击查看图片'
      img.addEventListener('click', () => {
        indexRef.value = index
        showPreview.value = true
      })
      handleImage()
    })
  }
  const handleImage = () => {
    imageList.value.forEach((img) => {
      if (imageDisplayMode.value === 'Mini') {
        img.style.width = `${miniMediaScale.value}%`
      } else if (imageDisplayMode.value === 'Hide') {
        img.style.display = 'none'
      } else {
        img.style.width = '100%'
        img.style.display = 'inline-block'
      }
    })
  }
  watch([imageDisplayMode, miniMediaScale], handleImage)

  onReady(() => {
    rendition.value.addEventListener('load', () => {
      const docs = rendition.value.renderer.getContents()
      docs.forEach(({ doc }) => {
        const imgs = [...doc.querySelectorAll('img'), ...doc.querySelectorAll('image')] as HTMLImageElement[]
        imageList.value = imgs
        initImage()
      })
    })
  })

  return { indexRef, showPreview, srcList, downloadImage, imageDisplayModeOptions, imageDisplayMode, miniMediaScale }
}
