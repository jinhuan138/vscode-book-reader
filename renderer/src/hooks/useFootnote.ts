import { rendition, onReady, onClose } from './useRendition'

const EPUB_NS = 'http://www.idpf.org/2007/ops'
type Footnote = { text: string }

const tokens = (element: Element, name: string, namespace?: string) =>
  ((namespace ? element.getAttributeNS?.(namespace, name) : element.getAttribute(name)) ?? '')
    .split(/\s+/)
    .filter(Boolean)

const targetElement = (target: any): Element | null => {
  if (!target) return null
  if (typeof target.closest === 'function') return target
  const node = target.commonAncestorContainer as Node | undefined
  return node?.nodeType === Node.ELEMENT_NODE ? (node as Element) : node?.parentElement ?? null
}

const isFootnoteReference = (anchor: HTMLAnchorElement) => {
  const types = tokens(anchor, 'type', EPUB_NS)
  const roles = tokens(anchor, 'role')
  if (
    types.some((value) => ['noteref', 'biblioref', 'glossref'].includes(value)) ||
    roles.some((value) => ['doc-noteref', 'doc-biblioref', 'doc-glossref'].includes(value))
  ) {
    return true
  }

  if (
    anchor.closest('.subscript') ||
    anchor.matches('sup') ||
    anchor.querySelector('sup') ||
    anchor.parentElement?.matches('sup')
  ) {
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
  const types = tokens(element, 'type', EPUB_NS)
  const roles = tokens(element, 'role')
  const hasNoteClass = tokens(element, 'class').some((value) =>
    /(^|[-_])(footnote|endnote|rearnote|note|fncontent|notecontent)([-_]|$)/i.test(value),
  )

  return (
    types.some((value) => ['footnote', 'endnote', 'rearnote', 'note'].includes(value)) ||
    roles.some((value) => ['doc-footnote', 'doc-endnote', 'note'].includes(value)) ||
    hasNoteClass ||
    element.matches('aside, li')
  )
}

const footnoteText = (target: any) => {
  for (let element = targetElement(target); element?.parentElement; element = element.parentElement) {
    if (isFootnoteContainer(element)) return element.textContent?.replace(/\s+/g, ' ').trim() ?? ''
  }
  return ''
}

export default function useFootnote() {
  const annotationDocs = new Map<number, Promise<Document | null>>()
  const footnotes = new WeakMap<HTMLAnchorElement, Promise<Footnote | null>>()
  const handlers = new Map<Document, () => void>()
  let popup: HTMLDivElement | null = null

  const closePopup = () => {
    popup?.remove()
    popup = null
  }

  const showPopup = (anchor: HTMLAnchorElement, text: string) => {
    closePopup()

    const dialog = document.createElement('div')
    const content = document.createElement('div')
    const close = document.createElement('button')
    dialog.setAttribute('role', 'dialog')
    dialog.setAttribute('aria-label', 'Close')
    dialog.style.cssText =
      'position:fixed;z-index:99999;max-width:min(420px,calc(100vw - 16px));max-height:50vh;overflow:auto;padding:12px 36px 12px 14px;border:1px solid rgba(128,128,128,.45);border-radius:6px;box-shadow:0 4px 18px rgba(0,0,0,.28);background:var(--book-background-color,#fff);color:var(--book-text-color,#000);font-size:14px;line-height:1.55'
    content.textContent = text
    content.style.whiteSpace = 'pre-wrap'
    close.type = 'button'
    close.textContent = '×'
    close.setAttribute('aria-label', 'Close')
    close.style.cssText =
      'position:absolute;top:5px;right:8px;width:24px;height:24px;padding:0;border:0;background:transparent;color:inherit;font-size:20px;line-height:20px;cursor:pointer'
    close.addEventListener('click', closePopup)
    dialog.append(content, close)
    document.body.appendChild(dialog)
    popup = dialog

    const rect = anchor.getBoundingClientRect()
    const frame = anchor.ownerDocument.defaultView?.frameElement as HTMLElement | null
    const frameRect = frame?.getBoundingClientRect()
    const left = rect.left + (frameRect?.left ?? 0)
    const top = rect.top + (frameRect?.top ?? 0)
    const margin = 8
    dialog.style.left = `${Math.min(Math.max(margin, left), Math.max(margin, window.innerWidth - dialog.offsetWidth - margin))}px`
    dialog.style.top = `${Math.max(margin, top + rect.height + margin + dialog.offsetHeight > window.innerHeight ? top - dialog.offsetHeight - margin : top + rect.height + margin)}px`
  }

  const resolveFootnote = async (anchor: HTMLAnchorElement, doc: Document, index: number) => {
    if (!isFootnoteReference(anchor)) return null

    const book = rendition.value?.book
    const section = book?.sections?.[index]
    const rawHref = anchor.getAttribute('href')
    if (!book?.resolveHref || !section || !rawHref) return null

    const href = section.resolveHref?.(rawHref) ?? rawHref
    const resolved = book.resolveHref(href)
    if (!resolved || resolved.index < 0) return null

    let targetDoc = doc
    if (resolved.index !== index) {
      let pending = annotationDocs.get(resolved.index)
      if (!pending) {
        pending = Promise.resolve(book.sections[resolved.index]?.createDocument?.() ?? null)
        annotationDocs.set(resolved.index, pending)
      }
      targetDoc = (await pending) ?? doc
    }

    const text = footnoteText(resolved.anchor(targetDoc))
    return text ? { text } : null
  }

  const install = (doc: Document, index: number) => {
    handlers.get(doc)?.()

    for (const anchor of doc.querySelectorAll<HTMLAnchorElement>('a[href*="#"]')) {
      if (!isFootnoteReference(anchor)) continue
      const footnote = resolveFootnote(anchor, doc, index).catch((error) => {
        console.warn('Failed to resolve footnote:', error)
        return null
      })
      footnotes.set(anchor, footnote)
      void footnote.then((info) => {
        if (info) anchor.title = info.text
      })
    }

    const handler = (event: Event) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href*="#"]') as HTMLAnchorElement | null
      const footnote = anchor && footnotes.get(anchor)
      if (!anchor || !footnote) return

      event.preventDefault()
      event.stopPropagation()
      void footnote.then((info) => {
        if (info) return showPopup(anchor, info.text)
        const rawHref = anchor.getAttribute('href')
        const href = rendition.value?.book?.sections?.[index]?.resolveHref?.(rawHref) ?? rawHref
        if (href) rendition.value?.goTo?.(href)
      })
    }

    doc.addEventListener('click', handler, true)
    handlers.set(doc, () => doc.removeEventListener('click', handler, true))
  }

  onReady(() => {
    rendition.value.addEventListener('load', (event: any) => {
      const { doc, index } = event.detail ?? {}
      if (doc && typeof index === 'number') install(doc, index)
    })
  })

  onClose(() => {
    handlers.forEach((remove) => remove())
    handlers.clear()
    annotationDocs.clear()
    closePopup()
  })
}
