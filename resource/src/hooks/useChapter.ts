import { ref, onBeforeUnmount } from 'vue'
import { rendition, onReady } from './useRendition'

const getLabel = (toc, href) => {
  let label = 'n/a'
  toc.some((item) => {
    if (item.subitems?.length > 0) {
      const subChapter = getLabel(item.subitems, href)
      if (subChapter !== 'n/a') {
        label = subChapter
        return true
      }
    } else if (item.href.includes(href)) {
      label = item.label
      return true
    }
  })
  return label
}
export default function useChapter() {
  const page = ref('')
  const onRelocate = ({ detail }) => {
    const { tocItem } = detail
    page.value = tocItem?.label || ''
  }

  onReady(() => {
    rendition.value.addEventListener('relocate', onRelocate)
  })

  onBeforeUnmount(() => {
    rendition.value.removeEventListener('relocate', onRelocate)
  })
  return page
}
