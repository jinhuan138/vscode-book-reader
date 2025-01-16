import { ref, watch, onBeforeUnmount } from 'vue'
import useRendition from './useRendition'
const [rendition] = useRendition()
let book

export default function useProgress() {
  const progress = ref<number>(0)
  const history = ref<string[]>([])

  const changeProgress = (val: number) => {
    if (!rendition.value.shadowRoot) {
      const cfi = book.locations.cfiFromPercentage(val / 100)
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
    if (!rendition.value.shadowRoot) {
      if (history.value.length > 0) rendition.value.display(history.value.pop())
    } else {
      rendition.value?.history.back()
    }
  }

  watch(rendition, (instance) => {
    if (!instance!.shadowRoot) {
      book = instance.book
      const stored = localStorage.getItem(book.key())
      const displayed = instance.display(stored || 1)
      book.ready
        .then(() => {
          return book.locations.generate(1600)
        })
        .then((locations) => {
          displayed.then(function () {
            var currentLocation = instance.currentLocation()
            const currentPage = book.locations.percentageFromCfi(
              currentLocation.start.cfi,
            )
            progress.value = Number((currentPage * 100).toFixed(2))
          })
          instance.on('relocated', (location) => {
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
      instance.addEventListener('relocate', onRelocate)
    }
  })

  onBeforeUnmount(() => {
    if (rendition.value.shadowRoot) {
      rendition.value.removeEventListener('relocate', onRelocate)
    }
  })

  return { progress, changeProgress, goBack }
}
