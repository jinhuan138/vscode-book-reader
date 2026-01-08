import { ref, watch, onMounted, onUnmounted } from 'vue'
import useVscode from './useVscode'
import { rendition, isEpub, onReady } from './useRendition'
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
    if (isEpub()) {
      rendition.value.flow(flow)
    } else {
      rendition.value?.renderer.setAttribute('flow', flow === 'paginated' ? 'paginated' : 'scrolled')
    }
  }
  onReady(() => {
    setFlow(defaultFlow)
    if (isSidebar.value && isEpub()) {
      rendition.value.hooks.content.register(({ document }) => {
        const annotation = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[]
        if (annotation.length) {
          const halfLength = Math.floor(annotation.length / 2)
          annotation.slice(0, halfLength).forEach((el) => {
            if (el.href) {
              const id = el.href.split('#')[1]
              const target = annotation.slice(halfLength).find((a: HTMLAnchorElement) => a.id === id)
              if (target && target.parentNode) {
                el.title = target.parentNode.textContent as string
              }
            }
          })
        }
      })
    }
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
