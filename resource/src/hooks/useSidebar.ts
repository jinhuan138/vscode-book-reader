import { ref, watch } from 'vue'
import { type UploadFile } from 'element-plus'
import useStore from './useStore'
import localforage from 'localforage'
const { addBook, url } = useStore()

export const isSidebar = ref(false)
//store last book
watch(isSidebar, async (is) => {
  if (is) {
    if (!url.value) {
      const lastBook = await localforage.getItem('lastBook')
      if (lastBook) {
        addBook(lastBook as UploadFile)
      }
    } else {
      localforage.setItem('lastBook', url.value)
    }
  }
})
