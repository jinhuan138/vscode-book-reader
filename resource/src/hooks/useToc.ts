import { ref } from 'vue'
import { rendition, onReady } from './useRendition'
export default function useToc() {
  const toc = ref<any[]>([])

  onReady(() => {
    toc.value = rendition.value.book.toc
  })

  return toc
}
