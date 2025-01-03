import { ref, watch } from 'vue'
import useRendition from './useRendition'
const [rendition] = useRendition()

const defaultBook = 'files/红楼梦.epub'
const url = ref(import.meta.env.MODE === 'development' ? defaultBook : '')
const type = ref('')

export default function useStore() {
  watch(rendition, (instance) => {
    if (!instance.shadowRoot) {
      const bookKey = instance.book.key()
      instance.on('relocated', (event) => {
        localStorage.setItem(bookKey, event.start.cfi)
      })
      instance.display(localStorage.getItem(bookKey) || 0)
    } else {
      const bookKey = url.value
      instance?.goTo(localStorage.getItem(bookKey) || 0)
      instance.addEventListener('relocate', ({ detail }) => {
        localStorage.setItem(bookKey, detail.cfi)
      })
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
  return { url, type }
}
