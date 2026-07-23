import useDisguise from '@/hooks/useDisguise'
import { rendition } from './useRendition'
import { watch } from 'vue'
const { active, codeDisguise } = useDisguise()
type Direction = 'next' | 'prev'

const boundDocuments = new WeakSet<Document>()

function isEditableTarget(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  const tagName = element?.tagName?.toLowerCase()
  return Boolean(
    element?.isContentEditable ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      element?.closest?.('[contenteditable=true]'),
  )
}

function keyListener(doc: Document, fn: (dire: Direction) => void) {
  if (boundDocuments.has(doc)) return
  boundDocuments.add(doc)

  doc.addEventListener(
    'keyup',
    (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isEditableTarget(e.target)) return

      const canFlip = !codeDisguise.value || active.value
      if (e.code === 'KeyS' || e.code === 'KeyD') {
        if (canFlip) fn('next')
      } else if (e.code === 'KeyA' || e.code === 'KeyW') {
        if (canFlip) fn('prev')
      }

      if (e.code === 'Space' && codeDisguise.value) {
        active.value = !active.value
      }
    },
    false,
  )
}

const flipPage = (direction: Direction) => {
  if (direction === 'next') {
    rendition.value.next()
  } else if (direction === 'prev') {
    rendition.value.prev()
  }
}

const focusRenderer = () => {
  rendition.value?.renderer.focus()
}

;(function useKeyboard() {
  watch(
    rendition,
    (newRendition: any) => {
      if (!newRendition) return

      // getRendition 可能在当前书页 load 完成后才回调，先补绑已加载的文档。
      const contents = newRendition.renderer?.getContents?.() ?? []
      for (const { doc } of contents) {
        if (doc) keyListener(doc, flipPage)
      }

      newRendition.addEventListener('load', (event: any) => {
        const doc = event.detail.doc
        newRendition.renderer.focus()
        keyListener(doc, flipPage)
      })
    },
    { flush: 'sync', immediate: true },
  )

  window.addEventListener('focus', focusRenderer)

  watch(active, (isActive: boolean) => {
    if (isActive) {
      focusRenderer()
    }
  })
})()
