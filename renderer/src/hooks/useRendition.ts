import { ref, watch } from 'vue'
export const rendition = ref<any>(null)

const readyListeners = new Set<() => void>()
const closeListeners = new Set<() => void>()

export function onReady(callback: () => void) {
  readyListeners.add(callback)
}

export function onClose(callback: () => void) {
  closeListeners.add(callback)
}

watch(rendition, (r) => {
  if (r) {
    readyListeners.forEach((cb) => cb())
  } else {
    closeListeners.forEach((cb) => cb())
  }
})