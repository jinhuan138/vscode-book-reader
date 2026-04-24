import { watch, onMounted, onUnmounted } from 'vue'
import useVscode from './useVscode'
import { rendition, onReady } from './useRendition'
import { isSidebar } from './useSidebar'
import { useLocalStorage } from '@vueuse/core'

const vscode = useVscode()
type Flow = 'paginated' | 'scrolled'
export default function useFlow() {
  const flow = useLocalStorage<Flow>('flow', 'paginated')

  const handleSetFlow = (e: KeyboardEvent) => {
    if (e.key === 's') {
      flow.value = flow.value === 'paginated' ? 'scrolled' : 'paginated'
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleSetFlow)
  })
  onUnmounted(() => {
    window.removeEventListener('keydown', handleSetFlow)
  })
  const setFlow = (flow: string) => {
    rendition.value?.renderer.setAttribute('flow', flow)
  }
  onReady(() => {
    setFlow(flow.value)
    // if (isSidebar.value && isEpub()) {
    //   rendition.value.hooks.content.register(({ document }) => {
    //     const annotation = Array.from(document.querySelectorAll('a')) as HTMLAnchorElement[]
    //     if (annotation.length) {
    //       const halfLength = Math.floor(annotation.length / 2)
    //       annotation.slice(0, halfLength).forEach((el) => {
    //         if (el.href) {
    //           const id = el.href.split('#')[1]
    //           const target = annotation.slice(halfLength).find((a: HTMLAnchorElement) => a.id === id)
    //           if (target && target.parentNode) {
    //             el.title = target.parentNode.textContent as string
    //           }
    //         }
    //       })
    //     }
    //   })
    // }
  })
  watch(flow, (f) => {
    setFlow(f)
    if (!isSidebar.value && vscode) {
      vscode.postMessage({
        type: 'flow',
        content: f,
      })
    }
  })
  return flow
}
