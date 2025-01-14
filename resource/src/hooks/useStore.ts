import { ref, watch, onBeforeUnmount } from 'vue'
import useRendition from './useRendition'
const [rendition] = useRendition()

const defaultBook = 'files/红楼梦.epub' //啼笑因缘.azw3
const url = ref(import.meta.env.MODE === 'development' ? defaultBook : '')
const type = ref('')

export default function useStore() {
  const  onRelocate =({ detail })=>{
    const bookKey = url.value
    localStorage.setItem(bookKey, detail.cfi)
  }

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
    if(!rendition.value.shadowRoot){
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })
  return { url, type }
}
