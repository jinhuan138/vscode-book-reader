import { getCurrentScope, onScopeDispose, ref, watch } from 'vue'
export const rendition = ref<any>(null)

const readyListeners = new Set<() => void>()
const closeListeners = new Set<() => void>()

export function onReady(callback: () => void) {
  readyListeners.add(callback)
  const unsubscribe = () => readyListeners.delete(callback)
  if (getCurrentScope()) onScopeDispose(unsubscribe)
  return unsubscribe
}

export function onClose(callback: () => void) {
  closeListeners.add(callback)
  const unsubscribe = () => closeListeners.delete(callback)
  if (getCurrentScope()) onScopeDispose(unsubscribe)
  return unsubscribe
}

watch(rendition, (r) => {
  if (r) {
    readyListeners.forEach((cb) => cb())
  } else {
    closeListeners.forEach((cb) => cb())
  }
})
