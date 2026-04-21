import { ref, onBeforeUnmount } from 'vue'
import { rendition, onReady } from './useRendition'
export default function useProgress() {
  const progress = ref<number>(0)
  // const flattenedToc = ref([])

  const changeProgress = (val: number) => {
    rendition.value.goToFraction(parseFloat(String(val / 100)))
  }

  // watch(toc, (_toc) => {
  //   if (isEpub()) {
  //     flattenedToc.value = (function flatten(items) {
  //       return [].concat(...items.map((item) => [item].concat(...flatten(item.children))))
  //     })(_toc)
  //   }
  // })

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

  return { progress, changeProgress, goBack }
}
