import { ref } from 'vue'
const rendition = ref<any>(null)
function setRendition(instance: any) {
  if (!instance.tagName) {
    rendition.value = instance
  } else {
    instance.addEventListener('load', () => {
      rendition.value = instance
    })
  }
}

export default function useRendition(): [typeof rendition, typeof setRendition] {
  return [rendition, setRendition]
}
