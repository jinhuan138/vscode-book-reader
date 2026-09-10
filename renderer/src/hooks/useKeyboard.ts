import { rendition } from './useRendition'
import { watch } from 'vue'
type Direction = 'next' | 'prev'

const boundDocuments = new WeakSet<Document>()

function keyListener(doc: Document, fn: (dire: Direction) => void) {
  if (boundDocuments.has(doc)) return
  boundDocuments.add(doc)

  doc.addEventListener(
    'keydown',
    (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return

      if (e.code === 'KeyS' || e.code === 'KeyD') {
        e.preventDefault()
        fn('next')
      } else if (e.code === 'KeyA' || e.code === 'KeyW') {
        e.preventDefault()
        fn('prev')
      }
    },
    false,
  )
}

const flipPage = async (direction: Direction) => {
  const currentRendition = rendition.value
  if (!currentRendition) return

  try {
    await currentRendition[direction]()
  } catch (error) {
    console.warn('Page navigation failed', error)
  }
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

})()
