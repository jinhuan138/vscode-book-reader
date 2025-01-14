import { ref, watch, onBeforeUnmount } from 'vue'
import useRendition from './useRendition'
import useToc from './useToc'
const [rendition] = useRendition()

const toc = useToc()
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

  watch(rendition, (instance) => {
    if (!instance.shadowRoot) {
      instance.on('locationChanged', () => {
        const { displayed, href } = instance.location.start
        if (href !== 'titlepage.xhtml') {
          const label = getLabel(toc.value, href)
          page.value = `${displayed.page}/${displayed.total} ${label}`
        }
      })
    } else {
      instance.addEventListener('relocate', onRelocate)
    }
  })

  onBeforeUnmount(() => {
    if(rendition.value.shadowRoot){
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })
  return page
}
