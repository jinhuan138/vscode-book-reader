import { ref, watch, onMounted, onUnmounted } from 'vue'
import useVscode from './useVscode'
import { rendition, onReady } from './useRendition'
import { isSidebar } from './useSidebar'

const vscode = useVscode()
type Flow = 'paginated' | 'scrolled-doc'
export default function useFlow() {
  const defaultFlow: Flow = (localStorage.getItem('flow') as Flow | null) || 'paginated'
  const flow = ref<Flow>(defaultFlow)

  const handleSetFlow = (e: KeyboardEvent) => {
    if (e.key === 's') {
      flow.value = flow.value === 'paginated' ? 'scrolled-doc' : 'paginated'
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleSetFlow)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', handleSetFlow)
  })
  const setFlow = (flow: string) => {
    rendition.value?.renderer.setAttribute('flow', flow === 'paginated' ? 'paginated' : 'scrolled')
  }
  onReady(() => {
    setFlow(defaultFlow)
  })
  watch(flow, (f) => {
    setFlow(f)
    if (!isSidebar.value && vscode) {
      vscode.postMessage({
        type: 'flow',
        content: f,
      })
    }
    localStorage.setItem('flow', f)
  })
  return flow
}
