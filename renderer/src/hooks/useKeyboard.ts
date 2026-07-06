import useDisguise from '@/hooks/useDisguise'
import { rendition } from './useRendition'
import { watch } from 'vue'
const { active } = useDisguise()
type Direction = 'next' | 'prev'
function keyListener(el: HTMLElement, fn: (dire: Direction) => void) {
  el.addEventListener(
    'keyup',
    (e: KeyboardEvent) => {
      if (e.key === 's' || e.key === 'd') {
        active.value && fn('next')
      } else if (e.key === 'a' || e.key === 'w') {
        active.value && fn('prev')
      }
      if (e.key === ' ' || e.code === 'Space') {
        active.value = !active.value
      }
    },
    false,
  )
}

const flipPage = (direction: string) => {
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
      newRendition.addEventListener('load', (event: any) => {
        const doc = event.detail.doc
        newRendition.renderer.focus()
        keyListener(doc, flipPage)
      })
    },
    { flush: 'sync' },
  )

  window.addEventListener('focus', focusRenderer)

  watch(active, (isActive: boolean) => {
    if (isActive) {
      focusRenderer()
    }
  })
})()
