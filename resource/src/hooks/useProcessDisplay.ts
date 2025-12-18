import { ref, watch } from 'vue'
const displayType = ['location', 'bar', 'chapter']
const progressDisplay = ref<string>(localStorage.getItem('displayType') || 'chapter')

export default function useProcessDisplay() {
  watch(progressDisplay, (display) => {
    localStorage.setItem('displayType', display)
  })
  return {
    progressDisplay,
    displayType,
  }
}
