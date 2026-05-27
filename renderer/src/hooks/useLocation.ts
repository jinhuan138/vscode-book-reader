import { ref } from 'vue'
import { rendition, onReady } from './useRendition'

export default function useLocation() {
  const location = ref('')
  onReady(() => {
    rendition.value.addEventListener('relocate', ({ detail }) => {
      const loc = detail.location
      location.value = `Loc ${loc.current}/${loc.total}`
    })
  })
  return location
}
