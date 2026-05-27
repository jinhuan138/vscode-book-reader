const displayType = ['location', 'bar', 'chapter']
import { useLocalStorage } from '@vueuse/core'
const progressDisplay = useLocalStorage<'location' | 'bar' | 'chapter'>('progressDisplay', 'chapter')

export default function useProcessDisplay() {
  return {
    progressDisplay,
    displayType,
  }
}
