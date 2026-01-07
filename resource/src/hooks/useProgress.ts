import { ref, onBeforeUnmount } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'

export default function useProgress() {
  const progress = ref<number>(0)
  const history = ref<string[]>([])

  const changeProgress = (val: number) => {
    if (isEpub()) {
      const cfi = rendition.value.book.locations.cfiFromPercentage(val / 100)
      rendition.value.display(cfi)
      history.value.push(cfi)
    } else {
      rendition.value.goToFraction(parseFloat(String(val / 100)))
    }
  }

  const onRelocate = ({ detail }) => {
    const { fraction } = detail
    const percent = Number((fraction * 100).toFixed(2))
    progress.value = percent
  }

  const goBack = () => {
    if (isEpub()) {
      if (history.value.length > 0) rendition.value.display(history.value.pop())
    } else {
      rendition.value?.history.back()
    }
  }

  onReady(() => {
    if (isEpub()) {
      const book = rendition.value.book
      const stored = localStorage.getItem(book.key())
      const displayed = rendition.value.display(stored || 1)
      book.ready
        .then(() => {
          return book.locations.generate(1600)
        })
        .then((locations) => {
          displayed.then(function () {
            var currentLocation = rendition.value.currentLocation()
            const currentPage = book.locations.percentageFromCfi(currentLocation.start.cfi)
            progress.value = Number((currentPage * 100).toFixed(2))
          })
          rendition.value.on('relocated', (location) => {
            const percent = book.locations.percentageFromCfi(location.start.cfi)
            const percentage = Number((percent * 100).toFixed(2))
            progress.value = percentage
          })
          if (stored) {
            const percent = book.locations.percentageFromCfi(stored)
            const percentage = Number((percent * 100).toFixed(2))
            progress.value = percentage
          }
        })
    } else {
      rendition.value.addEventListener('relocate', onRelocate)
    }
  })

  onBeforeUnmount(() => {
    if (!isEpub) {
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })

  return { progress, changeProgress, goBack }
}
