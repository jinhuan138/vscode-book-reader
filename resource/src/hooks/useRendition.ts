import { ref, watch } from 'vue'
export const rendition = ref<any>(null)

export const isEpub = () => !rendition.value?.tagName
const listeners = new Set<() => void>()
export function onReady(callback: () => void) {
  listeners.add(callback)
}

watch(rendition, () => {
  listeners.forEach((cb) => cb())
})
