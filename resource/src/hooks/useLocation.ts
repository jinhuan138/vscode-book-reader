import { ref, onBeforeUnmount } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'
export default function useLocation() {
  const location = ref('')
  const onRelocate = ({ detail }) => {
    const loc = detail.location
    location.value = `Loc ${loc.current}/${loc.total}`
  }

  onReady(() => {
    if (isEpub()) {
      rendition.value.on('relocated', (event: any) => {
        location.value = `Loc ${event.start.location}/${rendition.value.book.locations.length()}`
      })
    } else {
      rendition.value.addEventListener('relocate', onRelocate)
    }
  })

  onBeforeUnmount(() => {
    if (!isEpub()) {
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })
  return location
}
