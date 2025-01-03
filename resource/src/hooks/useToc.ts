import { ref, watch } from 'vue'
import useRendition from './useRendition'

const [rendition] = useRendition()

export default function useToc() {
  const toc = ref([])
  watch(rendition, (instance) => {
    if (!instance!.shadowRoot!) {
      instance.book.loaded.navigation.then(({ toc:_toc }) => {
        toc.value = _toc
      })
    } else {
      toc.value = instance.book.toc
    }
  })

  return toc
}
