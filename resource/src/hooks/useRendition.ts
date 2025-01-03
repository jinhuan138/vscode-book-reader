import { ref } from 'vue'
const rendition = ref<any>(null)

function setRendition(instance) {
  rendition.value = instance
}

export default function useRendition(): [
  typeof rendition,
  typeof setRendition,
] {
  return [rendition, setRendition]
}
