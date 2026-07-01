import { ref } from 'vue'
import { rendition, onReady, onClose } from './useRendition'

export type TocItem = {
  id: number
  label: string
  href: string
  subitems?: TocItem[]
}
export default function useToc() {
  const toc = ref<TocItem[]>([])

  onReady(() => {
    toc.value = rendition.value.book.toc
  })

  onClose(() => {
    toc.value = []
  })

  return toc
}