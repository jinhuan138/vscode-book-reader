import { ref, watch } from 'vue'
import useRendition from './useRendition'
const [rendition] = useRendition()

export default function useFlow() {
  const defaultSpread = localStorage.getItem('spread') || 'auto'
  const spread = ref(defaultSpread)
  const setSpread = (value) => {
    if (!rendition.value.shadowRoot) {
      rendition.value.spread(value)
    } else {
    }
  }
  watch(rendition, (instance) => {
    setSpread(spread.value)
  })
  watch(spread, (value) => {
    setSpread(value)
    localStorage.setItem('spread', value)
  })
  return spread
}
