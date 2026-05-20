import { ref, watch } from 'vue'
import { type UploadFile } from 'element-plus'
import useStore from './useStore'
import localforage from 'localforage'

const { addBook, url } = useStore()
const firstLoad = ref(true)

export const isSidebar = ref(false)
//store last book
watch([isSidebar, url], async ([is, u]) => {
  if (is) {
    if (!u && firstLoad.value) {
      firstLoad.value = false
      const lastBook = await localforage.getItem('lastBook')
      if (lastBook) {
        addBook(lastBook as string | UploadFile)
      }
    } else {
      localforage.setItem('lastBook', u)
    }
  }
})
