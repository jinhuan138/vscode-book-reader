import useStore from '@/hooks/useStore'
import useFlow from '@/hooks/useFlow'
import { isSidebar } from '@/hooks/useSidebar'
import useAnimation from '@/hooks/useAnimation'
import useTheme from '@/hooks/useTheme'
import useDisguise from '@/hooks/useDisguise'
import useTTS from '@/hooks/useTTS'
import { applyConfigUpdate } from '@/hooks/useVscode'

const { addBook } = useStore()
const flow = useFlow()
const { theme } = useTheme()
const animation = useAnimation()
const { codeDisguise, alwaysDisguiseTabTitle } = useDisguise()
const { ttsConfig } = useTTS()

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
        applyConfigUpdate('style', () => { theme.value = { ...theme.value, ...newTheme } })
        break
      case 'flow':
        applyConfigUpdate('flow', () => { flow.value = data.content })
        break
      case 'animation':
        applyConfigUpdate('animation', () => { animation.value = Boolean(data.content) })
        break
      case 'codeDisguise':
        applyConfigUpdate('codeDisguise', () => { codeDisguise.value = Boolean(data.content) })
        break
      case 'alwaysDisguiseTabTitle':
        applyConfigUpdate('alwaysDisguiseTabTitle', () => { alwaysDisguiseTabTitle.value = Boolean(data.content) })
        break
      case 'ttsConfig':
        applyConfigUpdate('ttsConfig', () => { ttsConfig.value = JSON.parse(data.content) })
        break
    }
  }
}
window.addEventListener('message', handleMessage)

window.focus()
