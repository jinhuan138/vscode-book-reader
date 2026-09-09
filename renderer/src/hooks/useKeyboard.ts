import useDisguise from '@/hooks/useDisguise'
import { rendition } from './useRendition'
import { watch } from 'vue'
const { active, codeDisguise } = useDisguise()
type Direction = 'next' | 'prev'

const boundDocuments = new WeakSet<Document>()

function keyListener(doc: Document, fn: (dire: Direction) => void) {
  if (boundDocuments.has(doc)) return
  boundDocuments.add(doc)

  doc.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return

      const canFlip = !codeDisguise.value || active.value
      if (e.code === 'KeyS' || e.code === 'KeyD') {
        if (canFlip) {
          e.preventDefault()
          fn('next')
        }
      } else if (e.code === 'KeyA' || e.code === 'KeyW') {
        if (canFlip) {
          e.preventDefault()
          fn('prev')
        }
      }
    },
    false,
  )
}

let isNavigating = false
let pendingDirection: Direction | null = null

const flipPage = async (direction: Direction) => {
  pendingDirection = direction
  if (isNavigating) return

  const currentRendition = rendition.value
  if (!currentRendition) return

  isNavigating = true
  try {
    // Navigation rebuilds iframe documents. Coalesce rapid key presses rather
    // than running next()/prev() concurrently.
    while (pendingDirection && rendition.value === currentRendition) {
      const nextDirection = pendingDirection
      pendingDirection = null
      await currentRendition[nextDirection]()
    }
  } catch (error) {
    console.warn('Page navigation failed', error)
  } finally {
    isNavigating = false
    pendingDirection = null
  }
}

const focusRenderer = () => {
  rendition.value?.renderer.focus()
}

;(function useKeyboard() {
  // Fixed-layout pages (such as CBZ) replace their iframe documents while
  // navigating. Also listen on the stable outer document so keyboard
  // navigation continues after the focused iframe has been removed.
  keyListener(document, flipPage)

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
