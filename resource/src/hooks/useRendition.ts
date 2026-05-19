import { ref, watch } from 'vue'
export const rendition = ref<any>(null)

const listeners = new Set<() => void>()
export function onReady(callback: () => void) {
  listeners.add(callback)
}
watch(rendition, (r) => {
  if (r) {
    listeners.forEach((cb) => cb())
  } else {
    listeners.clear()
  }
})
