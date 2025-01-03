import { ref, watch } from 'vue'
import useVscode from './useVscode'
import useRendition from './useRendition'

const vscode = useVscode()
const [rendition] = useRendition()
type Flow = 'paginated' | 'scrolled-doc'
export default function useFlow(isSidebar = false) {
  const defaultFlow: Flow =
    (localStorage.getItem('flow') as Flow | null) || 'paginated'
  const flow = ref<Flow>(defaultFlow)
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
    instance.on('rendered', (e: Event, iframe: any) => {
      iframe.document.addEventListener(
        'keyup',
        (e) => {
          if (e.key === 's') {
            flow.value =
              flow.value === 'paginated' ? 'scrolled-doc' : 'paginated'
          }
        },
        false,
      )
    })
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
