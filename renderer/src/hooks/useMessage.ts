import useStore from '@/hooks/useStore'
import useFlow from '@/hooks/useFlow'
import { isSidebar } from '@/hooks/useSidebar'
import useAnimation from '@/hooks/useAnimation'
import useTheme from '@/hooks/useTheme'
import useDisguise from '@/hooks/useDisguise'

const { addBook } = useStore()
const flow = useFlow()
const { theme } = useTheme()
const animation = useAnimation()
const { codeDisguise, sidebarDisguise, active } = useDisguise()

const handleMessage = ({ data }) => {
  if (data) {
    switch (data.type) {
      case 'openBook':
        addBook(data.content)
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
        animation.value = Boolean(data.content)
        break
      case 'codeDisguise':
        codeDisguise.value = Boolean(data.content)
        break
      case 'sidebarDisguise':
        sidebarDisguise.value = Boolean(data.content)
        break
      case 'active':
        active.value = Boolean(data.content)
        break
    }
  }
}
window.addEventListener('message', handleMessage)
window.focus()
window.addEventListener('blur', () => {
  if (!document.hasFocus() && codeDisguise.value && isSidebar.value) {
    active.value = false
  }
})

window.addEventListener('focus', () => {
  if (codeDisguise.value && isSidebar.value) {
    active.value = true
  }
})
