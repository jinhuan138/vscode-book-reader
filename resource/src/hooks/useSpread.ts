import { ref, watch } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'

export default function useFlow() {
  const defaultSpread = localStorage.getItem('spread') || 'auto'
  const spread = ref(defaultSpread)
  const setSpread = (type: string) => {
    if (isEpub()) {
      rendition.value.spread(type)
    } else {
    }
  }
  onReady(() => {
    setSpread(spread.value)
  })

  watch(spread, (value) => {
    setSpread(value)
    localStorage.setItem('spread', value)
  })
  return spread
}
