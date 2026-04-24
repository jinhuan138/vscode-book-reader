import { watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import useVscode from './useVscode'
import { rendition, onReady } from './useRendition'
import { isSidebar } from './useSidebar'

const vscode = useVscode()
export default function useAnimation() {
  const animation = useLocalStorage('animation', false)
  const setAnimation = (animated: boolean) => {
    if (animated) {
      rendition.value.renderer.setAttribute('animated', '')
    } else {
      rendition.value.renderer.removeAttribute('animated')
    }
  }
  onReady(() => setAnimation(animation.value))
  watch(animation, (a) => {
    setAnimation(a)
    if (!isSidebar.value && vscode) {
      vscode.postMessage({
        type: 'animation',
        content: String(a),
      })
    }
  })
  return animation
}
