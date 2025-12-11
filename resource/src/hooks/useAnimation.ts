import { ref, watch } from 'vue'
import useVscode from './useVscode'
import useRendition from './useRendition'

const vscode = useVscode()
const [rendition] = useRendition()
export default function useAnimation(isSidebar = false) {
  const defaultAnimation = JSON.parse(
    localStorage.getItem('animation') || 'false',
  )
  const animation = ref<boolean>(defaultAnimation)
  const setAnimation = (animated) => {
    if (!rendition.value.tagName) {
      rendition.value.hooks.content.register((contents) => {
        rendition.value.manager.container.style['scroll-behavior'] = animated
          ? 'smooth'
          : ''
      })
    } else {
      if (animated) {
        rendition.value.renderer.setAttribute('animated', '')
      } else {
        rendition.value.renderer.removeAttribute('animated')
      }
    }
  }
  watch(rendition, (instance) => {
    setAnimation(defaultAnimation)
  })
  watch(animation, (value) => {
    setAnimation(value)
    if (!isSidebar && vscode) {
      vscode.postMessage({
        type: 'animation',
        content: String(value),
      })
    }
    localStorage.setItem('animation', String(value))
  })
  return animation
}
