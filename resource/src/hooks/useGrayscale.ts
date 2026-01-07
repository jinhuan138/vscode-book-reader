import { ref, watch } from 'vue'
import useVscode from './useVscode'
import { rendition, isEpub, onReady } from './useRendition'
const vscode = useVscode()

export default function useGrayscale(isSidebar = false) {
  const defaultGrayscale = JSON.parse(localStorage.getItem('grayscale') || 'false')
  const grayscale = ref<boolean>(defaultGrayscale)
  const setGrayscale = (enabled: boolean) => {
    if (isEpub()) {
      rendition.value.themes.default({
        html: {
          filter: enabled ? 'grayscale(100%)' : 'none',
        },
      })
    } else {
      rendition.value.renderer?.setStyles([
        `html {
           filter: ${enabled ? 'grayscale(100%)' : 'none'};
        }`,
      ])
    }
  }
  onReady(()=>setGrayscale(grayscale.value))
  watch(grayscale, (enabled) => {
    setGrayscale(enabled)
    if (!isSidebar && vscode) {
      vscode.postMessage({
        type: 'grayscale',
        content: enabled,
      })
    }
    localStorage.setItem('grayscale', String(enabled))
  })
  return grayscale
}
