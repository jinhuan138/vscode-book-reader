import { ref, watch } from 'vue'
import useRendition from './useRendition'
const [rendition] = useRendition()
let book

export default function useProgress() {
  const progress = ref<number>(0)
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
      instance.addEventListener('relocate', ({ detail }) => {
        const { fraction } = detail
        const percent = Number((fraction * 100).toFixed(2))
        progress.value = percent
      })
    }
  })

  const changeProgress = (val: number) => {
    if (!rendition.value.shadowRoot) {
      const cfi = book.locations.cfiFromPercentage(val / 100)
      rendition.value.display(cfi)
    } else {
      rendition.value.goToFraction(parseFloat(String(val / 100)))
    }
  }

  return { progress, changeProgress }
}
