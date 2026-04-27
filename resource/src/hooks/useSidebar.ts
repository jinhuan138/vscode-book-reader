import { ref, watch } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import useStore from './useStore'

const { bookKey } = useStore()
const lastBook = useLocalStorage<string>('lastBook', '')

export const isSidebar = ref(false)
//store last book
watch(isSidebar, async (is) => {
  if (is) {
    lastBook.value = bookKey.value
  }
  if (is && !bookKey.value) {
    bookKey.value = lastBook.value
  }
})
