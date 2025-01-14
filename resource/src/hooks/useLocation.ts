import { ref, watch, onBeforeUnmount } from 'vue'
import useRendition from './useRendition'
const [rendition] = useRendition()
export default function useLocation() {
  const location = ref('')
  const onRelocate = ({ detail }) => {
    const loc = detail.location
    location.value = `Loc ${loc.current}/${loc.total}`
  }

  watch(rendition, (instance) => {
    if (!instance.shadowRoot) {
      instance.on('relocated', (event: any) => {
        location.value = `Loc ${event.start.location}/${instance.book.locations.length()}`
      })
    } else {
      instance.addEventListener('relocate', onRelocate)
    }
  })

  onBeforeUnmount(() => {
    if (rendition.value.shadowRoot) {
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })
  return location
}
