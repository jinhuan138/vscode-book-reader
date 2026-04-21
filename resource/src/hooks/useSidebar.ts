import { ref, watch } from 'vue'
import useStore from './useStore'

// const bookDB = createInstance({
//   name: 'bookList',
// })
const { url, type } = useStore()

export const isSidebar = ref(false)

watch(isSidebar, async (is) => {
  // if (is) {
  //   bookDB.setItem('lastBookType', type.value)
  // }
  // if (is && !url.value) {
  //   type.value = (await bookDB.getItem('lastBookType')) || ''
  //   url.value = (await bookDB.getItem('lastBook')) || ''
  // }
})
