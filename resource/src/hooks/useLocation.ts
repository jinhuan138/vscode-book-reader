import { ref } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'

export default function useLocation() {
  const location = ref('')
  onReady(() => {
    if (isEpub()) {
      rendition.value.on('relocated', (event: any) => {
        location.value = `Loc ${event.start.location}/${rendition.value.book.locations.length()}`
      })
    } else {
      rendition.value.addEventListener('relocate', ({ detail }) => {
        const loc = detail.location
        location.value = `Loc ${loc.current}/${loc.total}`
      })
    }
  })
  return location
}
