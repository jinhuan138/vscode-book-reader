import { ref } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'

export default function useToc() {
  const toc = ref([])

  onReady(() => {
    if (isEpub()) {
      rendition.value.book.loaded.navigation.then(({ toc: _toc }) => {
        toc.value = _toc
      })
    } else {
      toc.value = rendition.value.book.toc
    }
  })

  return toc
}
