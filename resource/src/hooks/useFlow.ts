import { ref, watch, onMounted, onUnmounted } from 'vue'
import useVscode from './useVscode'
import useRendition from './useRendition'

const vscode = useVscode()
const [rendition] = useRendition()
type Flow = 'paginated' | 'scrolled-doc'
export default function useFlow(isSidebar = false) {
  const defaultFlow: Flow =
    (localStorage.getItem('flow') as Flow | null) || 'paginated'
  const flow = ref<Flow>(defaultFlow)

  const handleSetFlow = (e: KeyboardEvent) => {
    console.log(e.key,'s')
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
  const setFlow = (flow) => {
    if (!rendition.value.shadowRoot) {
      rendition.value.flow(flow)
    } else {
      rendition.value?.renderer.setAttribute(
        'flow',
        flow === 'paginated' ? 'paginated' : 'scrolled',
      )
    }
  }
  watch(rendition, (instance) => {
    setFlow(defaultFlow)
    if (isSidebar && !instance.shadowRoot) {
      instance.hooks.content.register(({ document }) => {
        const annotation = Array.from(
          document.querySelectorAll('a'),
        ) as HTMLAnchorElement[]
        if (annotation.length) {
          const halfLength = Math.floor(annotation.length / 2)
          annotation.slice(0, halfLength).forEach((el) => {
            if (el.href) {
              const id = el.href.split('#')[1]
              const target = annotation
                .slice(halfLength)
                .find((a: HTMLAnchorElement) => a.id === id)
              if (target && target.parentNode) {
                el.title = target.parentNode.textContent as string
              }
            }
          })
        }
      })
    }
  })
  watch(flow, (value) => {
    setFlow(value)
    if (!isSidebar && vscode) {
      vscode.postMessage({
        type: 'flow',
        content: value,
      })
    }
    localStorage.setItem('flow', value)
  })
  return flow
}
