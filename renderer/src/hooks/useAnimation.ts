import { watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { saveConfig } from './useVscode'
import { rendition, onReady } from './useRendition'
import { isSidebar } from './useSidebar'

export default function useAnimation() {
  const animation = useLocalStorage<boolean>('animation', false)
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
    if (!isSidebar.value) {
      void saveConfig('animation', a)
    }
  })
  return animation
}
