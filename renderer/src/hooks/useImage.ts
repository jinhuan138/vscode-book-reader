import { ref, computed, watch } from 'vue'
import useVscode from './useVscode'
import { rendition, onReady, onClose } from './useRendition'
import { useLocalStorage } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const vscode = useVscode()
const EPUB_NS = 'http://www.idpf.org/2007/ops'
type FootnoteInfo = { text: string }

const getTargetElement = (target: any): Element | null => {
  if (!target) return null
  if (typeof target.closest === 'function') return target as Element

  const node = target.commonAncestorContainer as Node | undefined
  if (!node) return null
  return node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement
}

const getAttributeTokens = (element: Element, name: string, namespace?: string) => {
  const value = namespace
    ? element.getAttributeNS?.(namespace, name)
    : element.getAttribute(name)
  return (value ?? '').split(/\s+/).filter(Boolean)
}

const isFootnoteReference = (anchor: HTMLAnchorElement) => {
  const types = getAttributeTokens(anchor, 'type', EPUB_NS)
  const roles = getAttributeTokens(anchor, 'role')
  if (
    types.some((value) => ['noteref', 'biblioref', 'glossref'].includes(value)) ||
    roles.some((value) => ['doc-noteref', 'doc-biblioref', 'doc-glossref'].includes(value))
  ) {
    return true
  }

  // This EPUB uses <a><sup>(1)</sup></a> without EPUB footnote metadata.
  if (anchor.matches('sup') || anchor.querySelector('sup') || anchor.parentElement?.matches('sup')) {
    return true
  }

  try {
    const verticalAlign = getComputedStyle(anchor).verticalAlign
    return ['super', 'top', 'text-top'].includes(verticalAlign) || /^\d/.test(verticalAlign)
  } catch {
    return false
  }
}

const isFootnoteContainer = (element: Element) => {
  const types = getAttributeTokens(element, 'type', EPUB_NS)
  const roles = getAttributeTokens(element, 'role')
  const className = element.getAttribute('class') ?? ''

  return (
    types.some((value) => ['footnote', 'endnote', 'rearnote', 'note'].includes(value)) ||
    roles.some((value) => ['doc-footnote', 'doc-endnote', 'note'].includes(value)) ||
    /(^|[-_])(footnote|endnote|fncontent)([-_]|$)/i.test(className) ||
    element.matches('aside, li')
  )
}

const getFootnoteContainer = (doc: Document, target: any) => {
  const element = getTargetElement(target)
  if (!element) return null

  let current: Element | null = element
  while (current && current !== doc.body) {
    if (isFootnoteContainer(current)) return current
    current = current.parentElement
  }

  return null
}

const getFootnoteRect = (anchor: HTMLAnchorElement) => {
  const rect = anchor.getBoundingClientRect()
  const frame = anchor.ownerDocument.defaultView?.frameElement as HTMLElement | null
  const frameRect = frame?.getBoundingClientRect()
  const left = rect.left + (frameRect?.left ?? 0)
  const top = rect.top + (frameRect?.top ?? 0)

  return { left, top, bottom: top + rect.height }
}

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
  const { t, locale } = useI18n()
  const imageList = ref<HTMLImageElement[]>([])
  const srcList = computed(() => imageList.value.map((img) => img.src || (img.getAttribute('xlink:href') as string)))
  const indexRef = ref<number>(0)
  const showPreview = ref<boolean>(false)
  const imageDisplayModeOptions = ['Normal', 'Mini', 'Hide']
  const imageDisplayMode = useLocalStorage<'Normal' | 'Mini' | 'Hide'>('imageDisplayMode', 'Normal')
  const miniMediaScale = useLocalStorage<number>('miniMediaScale', 100)

  const annotationDocs = new Map<number, Promise<Document | null>>()
  let footnoteTargets = new WeakMap<HTMLAnchorElement, Promise<FootnoteInfo | null>>()
  const footnoteHandlers = new Map<Document, () => void>()
  let footnotePopup: HTMLDivElement | null = null

  const closeFootnotePopup = () => {
    footnotePopup?.remove()
    footnotePopup = null
  }

  const showFootnotePopup = (anchor: HTMLAnchorElement, text: string) => {
    closeFootnotePopup()

    const popup = document.createElement('div')
    const content = document.createElement('div')
    const close = document.createElement('button')

    popup.setAttribute('role', 'dialog')
    popup.setAttribute('aria-label', 'Close')
    Object.assign(popup.style, {
      position: 'fixed',
      zIndex: '99999',
      maxWidth: 'min(420px, calc(100vw - 16px))',
      maxHeight: '50vh',
      overflow: 'auto',
      padding: '12px 36px 12px 14px',
      border: '1px solid rgba(128, 128, 128, 0.45)',
      borderRadius: '6px',
      boxShadow: '0 4px 18px rgba(0, 0, 0, 0.28)',
      background: 'var(--book-background-color, #fff)',
      color: 'var(--book-text-color, #000)',
      fontSize: '14px',
      lineHeight: '1.55',
    })

    content.textContent = text
    content.style.whiteSpace = 'pre-wrap'

    close.type = 'button'
    close.textContent = '×'
    close.setAttribute('aria-label', 'Close')
    Object.assign(close.style, {
      position: 'absolute',
      top: '5px',
      right: '8px',
      width: '24px',
      height: '24px',
      padding: '0',
      border: '0',
      background: 'transparent',
      color: 'inherit',
      fontSize: '20px',
      lineHeight: '20px',
      cursor: 'pointer',
    })

    close.addEventListener('click', closeFootnotePopup)
    popup.append(content, close)
    document.body.appendChild(popup)
    footnotePopup = popup

    const rect = getFootnoteRect(anchor)
    const margin = 8
    const left = Math.min(
      Math.max(margin, rect.left),
      Math.max(margin, window.innerWidth - popup.offsetWidth - margin),
    )
    let top = rect.bottom + margin
    if (top + popup.offsetHeight > window.innerHeight - margin) {
      top = rect.top - popup.offsetHeight - margin
    }

    popup.style.left = `${left}px`
    popup.style.top = `${Math.max(margin, top)}px`
  }

  const getAnnotationDoc = (
    book: any,
    index: number,
    currentIndex: number,
    currentDoc: Document,
  ) => {
    if (index === currentIndex) return Promise.resolve(currentDoc)

    const cached = annotationDocs.get(index)
    if (cached) return cached

    const promise = Promise.resolve(book.sections[index]?.createDocument?.() ?? null)
    annotationDocs.set(index, promise)
    return promise
  }

  const resolveFootnote = async (
    anchor: HTMLAnchorElement,
    doc: Document,
    currentIndex: number,
  ): Promise<FootnoteInfo | null> => {
    if (!isFootnoteReference(anchor)) return null

    const book = rendition.value?.book
    const section = book?.sections?.[currentIndex]
    const rawHref = anchor.getAttribute('href')
    if (!book?.resolveHref || !section || !rawHref) return null

    // Resolve relative href against the current EPUB section first.
    const href = section.resolveHref?.(rawHref) ?? rawHref
    const resolved = book.resolveHref(href)
    if (!resolved || resolved.index < 0) return null

    const targetDoc = await getAnnotationDoc(book, resolved.index, currentIndex, doc)
    if (!targetDoc) return null

    const target = resolved.anchor(targetDoc)
    const container = getFootnoteContainer(targetDoc, target)
    const text = container?.textContent?.replace(/\s+/g, ' ').trim()
    return text ? { text } : null
  }

  const addAnnotationTitles = (doc: Document, index: number) => {
    const anchors = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href*="#"]'))

    anchors.forEach((anchor) => {
      const promise = resolveFootnote(anchor, doc, index).catch((error) => {
        console.warn('Failed to resolve footnote:', error)
        return null
      })
      if (isFootnoteReference(anchor)) footnoteTargets.set(anchor, promise)
      void promise.then((info) => {
        if (info) anchor.title = info.text
      })
    })
  }

  const installFootnoteClickHandler = (doc: Document, index: number) => {
    footnoteHandlers.get(doc)?.()

    const handler = (event: Event) => {
      const target = event.target as Element | null
      const anchor = target?.closest?.('a[href*="#"]') as HTMLAnchorElement | null
      if (!anchor) return

      const promise = footnoteTargets.get(anchor)
      if (!promise) return

      // Prevent foliate-js from navigating before the target section is loaded.
      event.preventDefault()
      event.stopPropagation()

      void promise.then((info) => {
        if (info) {
          showFootnotePopup(anchor, info.text)
          return
        }

        // Preserve navigation for a superscript link that is not a footnote.
        const rawHref = anchor.getAttribute('href')
        const href = rendition.value?.book?.sections?.[index]?.resolveHref?.(rawHref) ?? rawHref
        if (href) rendition.value?.goTo?.(href)
      })
    }

    doc.addEventListener('click', handler, true)
    footnoteHandlers.set(doc, () => doc.removeEventListener('click', handler, true))
  }

  const cleanupFootnotes = () => {
    footnoteHandlers.forEach((cleanup) => cleanup())
    footnoteHandlers.clear()
    annotationDocs.clear()
    footnoteTargets = new WeakMap()
    closeFootnotePopup()
  }

  const updateImageTitles = () => {
    imageList.value.forEach((img) => {
      img.title = t('settings.viewImage')
    })
  }

  const downloadImage = (index: number) => {
    if (vscode) {
      imageUrlToUint8Array(srcList.value[index]).then((data) => {
        vscode.postMessage({
          type: 'download',
          content: data,
        })
      })
    } else {
      const downloadLink = document.createElement('a')
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
      img.title = t('settings.viewImage')
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
  watch(locale, updateImageTitles)

  onReady(() => {
    rendition.value.addEventListener('load', (event: any) => {
      const { doc, index } = event.detail ?? {}
      if (!doc || typeof index !== 'number') return

      const imgs = [...doc.querySelectorAll('img'), ...doc.querySelectorAll('image')] as HTMLImageElement[]
      imageList.value = imgs
      initImage()
      addAnnotationTitles(doc, index)
      installFootnoteClickHandler(doc, index)
    })
  })

  onClose(cleanupFootnotes)

  return {
    indexRef,
    showPreview,
    srcList,
    downloadImage,
    imageDisplayModeOptions,
    imageDisplayMode,
    miniMediaScale,
  }
}