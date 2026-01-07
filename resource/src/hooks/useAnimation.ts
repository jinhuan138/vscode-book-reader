import { ref, watch } from 'vue'
import useVscode from './useVscode'
import { rendition, isEpub, onReady } from './useRendition'

const vscode = useVscode()
export default function useAnimation(isSidebar = false) {
  const defaultAnimation = JSON.parse(localStorage.getItem('animation') || 'false')
  const animation = ref<boolean>(defaultAnimation)
  const setAnimation = (animated: boolean) => {
    if (isEpub()) {
      rendition.value.hooks.content.register(() => {
        rendition.value.manager.container.style['scroll-behavior'] = animated ? 'smooth' : ''
      })
    } else {
      if (animated) {
        rendition.value.renderer.setAttribute('animated', '')
      } else {
        rendition.value.renderer.removeAttribute('animated')
      }
    }
  }
  onReady(() => setAnimation(defaultAnimation))
  watch(animation, (a) => {
    setAnimation(a)
    if (!isSidebar && vscode) {
      vscode.postMessage({
        type: 'animation',
        content: String(a),
      })
    }
    localStorage.setItem('animation', String(a))
  })
  return animation
}
