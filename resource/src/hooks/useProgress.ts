import { ref, onBeforeUnmount } from 'vue'
import { rendition, onReady } from './useRendition'
export default function useProgress() {
  const progress = ref<number>(0)
  const changeProgress = (val: number) => {
    rendition.value.goToFraction(parseFloat(String(val / 100)))
  }
  const labelFromPercentage = (percent: number) => {
    const label = rendition.value?.getLabelByFraction(percent / 100)
    return label ? label : `${Math.floor(percent)}%`
  }

  const onRelocate = ({ detail }) => {
    const { fraction } = detail
    const percent = Number((fraction * 100).toFixed(2))
    progress.value = percent
  }

  const goBack = () => {
    rendition.value?.history.back()
  }

  onReady(() => {
    rendition.value.addEventListener('relocate', onRelocate)
  })

  onBeforeUnmount(() => {
    rendition.value.removeEventListener('relocate', onRelocate)
  })

  return { progress, changeProgress, labelFromPercentage, goBack }
}
