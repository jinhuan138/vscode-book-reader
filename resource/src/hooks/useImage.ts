import { ref, watch } from 'vue'
import useVscode from './useVscode'
import useRendition from './useRendition'

const vscode = useVscode()
const [rendition] = useRendition()

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
  const imgsRef = ref<string[]>([])
  const visibleRef = ref<boolean>(false)
  const indexRef = ref<number>(0)
  const downloadImage = () => {
    if (vscode) {
      imageUrlToUint8Array(imgsRef.value[indexRef.value]).then((data) => {
        vscode.postMessage({
          type: 'download',
          content: data,
        })
      })
    } else {
      var downloadLink = document.createElement('a')
      downloadLink.href = imgsRef.value[indexRef.value]
      downloadLink.download = Date.now() + '.jpg'
      downloadLink.style.display = 'none'
      document.body.appendChild(downloadLink)
      downloadLink.click()
      document.body.removeChild(downloadLink)
    }
  }
  const handleImage = (imageElements: Array<HTMLImageElement>) => {
    imgsRef.value = imageElements.map((img, index) => {
      img.title = '点击查看图片'
      img.addEventListener('click', () => {
        visibleRef.value = true
        indexRef.value = index
      })
      return img.src || (img.getAttribute('xlink:href') as string)
    })
  }
  watch(rendition, (instance) => {
    if (!instance.tagName) {
      instance.themes.default({
        img: {
          cursor: 'pointer',
        },
        image: {
          cursor: 'pointer',
        },
      })
      instance.hooks.content.register((content: { document: Document }) => {
        const imgs = [...document.querySelectorAll('img'), ...document.querySelectorAll('image')] as HTMLImageElement[]
        console.log(imgs)
        handleImage(imgs)
      })
    } else {
      instance.renderer?.setStyles([
        `img, image {
           cursor: pointer;
        }`,
      ])
      const docs = instance.renderer.getContents()
      docs.forEach(({ doc }) => {
        const imgs = [...doc.querySelectorAll('img'), ...doc.querySelectorAll('image')]
        handleImage(imgs)
      })
    }
  })

  return { visibleRef, indexRef, imgsRef, downloadImage }
}
