import { ref, computed, watch } from 'vue'
import useVscode from './useVscode'
import { rendition, isEpub, onReady } from './useRendition'

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
  const imageDisplayMode = ref(localStorage.getItem('imageDisplayMode') || 'Normal')
  const miniMediaScale = ref<number>(Number(localStorage.getItem('miniMediaScale') || 100))
  const downloadImage = () => {
    if (vscode) {
      imageUrlToUint8Array(srcList.value[indexRef.value]).then((data) => {
        vscode.postMessage({
          type: 'download',
          content: data,
        })
      })
    } else {
      var downloadLink = document.createElement('a')
      downloadLink.href = srcList.value[indexRef.value]
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
    console.log(imageList.value)
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
  watch([imageDisplayMode, miniMediaScale], ([mode, scale]) => {
    localStorage.setItem('imageDisplayMode', mode)
    localStorage.setItem('miniMediaScale', scale.toString())
    handleImage()
  })

  onReady(() => {
    if (isEpub()) {
      rendition.value.themes.default({
        img: {
          cursor: 'pointer',
        },
        image: {
          cursor: 'pointer',
        },
      })
      rendition.value.hooks.content.register((content: { document: Document }) => {
        const imgs = [...document.querySelectorAll('img'), ...document.querySelectorAll('image')] as HTMLImageElement[]
        imageList.value = imgs
        console.log(imageList.value)
        initImage()
      })
    } else {
      rendition.value.addEventListener('load', () => {
        rendition.value.renderer?.setStyles([
          `img, image {
           cursor: pointer;
        }`,
        ])
        const docs = rendition.value.renderer.getContents()
        docs.forEach(({ doc }) => {
          const imgs = [...doc.querySelectorAll('img'), ...doc.querySelectorAll('image')]
          imageList.value = imgs
          console.log(imageList.value)
          initImage()
        })
      })
    }
  })

  return { indexRef, showPreview, srcList, downloadImage, imageDisplayModeOptions, imageDisplayMode, miniMediaScale }
}
