import { onBeforeMount, onUnmounted } from 'vue'
import useStore from '@/hooks/useStore'
import useFlow from '@/hooks/useFlow'
import { isSidebar } from '@/hooks/useSidebar'
import useAnimation from '@/hooks/useAnimation'
import useTheme from '@/hooks/useTheme'

const { bookKey, addBook } = useStore()
const flow = useFlow()
const { theme } = useTheme()
const animation = useAnimation()

const handleMessage = ({ data }) => {
  if (data) {
    switch (data.type) {
      case 'open':
        addBook(data.content).then((id) => {
          bookKey.value = id
        })
        break
      case 'isSidebar':
        isSidebar.value = true
        break
      case 'style':
        const newTheme = JSON.parse(data.content)
        Object.keys(newTheme).forEach((key) => {
          if (key in theme.value) {
            theme.value[key] = newTheme[key]
          }
        })
        break
      case 'flow':
        flow.value = data.content
        break
      case 'animation':
        animation.value = JSON.parse(data.content)
        break
    }
  }
}

window.addEventListener('message', handleMessage)
onUnmounted(() => {
  window.removeEventListener('message', handleMessage)
})
