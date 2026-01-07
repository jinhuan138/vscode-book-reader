/// <reference types="vite/client" />
import { ref, watch, onBeforeUnmount } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'

const defaultBook = 'files/梵高手稿（典藏修订版）.azw3' //啼笑因缘.azw3
const url = ref(import.meta.env.MODE === 'development' ? defaultBook : '')
const type = ref('')

export default function useStore() {
  const onRelocate = (event: any) => {
    const bookKey = url.value
    localStorage.setItem(bookKey, event.detail.cfi)
  }
  onReady(() => {
    if (isEpub()) {
      const bookKey = rendition.value.book.key ? rendition.value.book.key() : url.value
      rendition.value.on('relocated', (event: any) => {
        localStorage.setItem(bookKey, event.start.cfi)
      })
      rendition.value.display(localStorage.getItem(bookKey) || 0)
    } else {
      const bookKey = url.value
      rendition.value?.goTo(localStorage.getItem(bookKey) || 0)
      rendition.value.addEventListener('relocate', onRelocate)
    }
  })

  watch(
    url,
    (val) => {
      if (val && typeof val === 'string') {
        type.value = val.split('.').pop() as string
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (!isEpub()) {
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })
  return { url, type }
}
