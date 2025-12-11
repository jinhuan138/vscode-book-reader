/// <reference types="vite/client" />
import { ref, watch, onBeforeUnmount } from 'vue'
import useRendition from './useRendition'
const [rendition] = useRendition()

const defaultBook = 'files/啼笑因缘.mobi' //啼笑因缘.azw3
const url = ref(import.meta.env.MODE === 'development' ? defaultBook : '')
const type = ref('')

export default function useStore() {
  const onRelocate = (event: any) => {
    const bookKey = url.value
    localStorage.setItem(bookKey, event.detail.cfi)
  }

  watch(rendition, (instance) => {
    if (!instance.tagName) {
      console.log(instance.book)
      const bookKey = instance.book.key ? instance.book.key() : url.value
      instance.on('relocated', (event: any) => {
        localStorage.setItem(bookKey, event.start.cfi)
      })
      instance.display(localStorage.getItem(bookKey) || 0)
    } else {
      const bookKey = url.value
      instance?.goTo(localStorage.getItem(bookKey) || 0)
      instance.addEventListener('relocate', onRelocate)
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
    if (rendition.value.tagName) {
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })
  return { url, type }
}
