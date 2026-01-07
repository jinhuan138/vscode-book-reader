import useDisguise from '@/hooks/useDisguise'
import { rendition, isEpub, onReady } from './useRendition'
const { active } = useDisguise()
type Direction = 'next' | 'prev'
function keyListener(el: HTMLElement, fn: (dire: Direction) => void) {
  el.addEventListener(
    'keyup',
    (e: KeyboardEvent) => {
      // Right or up arrow key indicates next
      if (e.key === 's' || e.key === 'd') {
        fn('next')
      }
      // left or down arrow key indicates next
      else if (e.key === 'a' || e.key === 'w') {
        fn('prev')
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
;(function useKeyboard() {
  onReady(() => {
    if (isEpub()) {
      rendition.value.on('rendered', (e: Event, iframe: any) => {
        iframe?.iframe?.contentWindow.focus()
        keyListener(iframe.document, flipPage)
      })
    } else {
      rendition.value.addEventListener('load', (event:any) => {
        const doc = event.detail.doc
        rendition.value.renderer.focus()
        keyListener(doc, flipPage)
      })
    }
  })
})()
