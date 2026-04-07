import { ref, onBeforeUnmount, watch } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'
import useToc from '@/hooks/useToc'

const toc = useToc()

export default function useProgress() {
  const progress = ref<number>(0)
  const history = ref<string[]>([])
  const flattenedToc = ref([])

  const changeProgress = (val: number) => {
    if (isEpub()) {
      const cfi = rendition.value.book.locations.cfiFromPercentage(val / 100)
      rendition.value.display(cfi)
    } else {
      rendition.value.goToFraction(parseFloat(String(val / 100)))
    }
  }

  watch(toc, (_toc) => {
    if (isEpub()) {
      flattenedToc.value = (function flatten(items) {
        return [].concat(...items.map((item) => [item].concat(...flatten(item.children))))
      })(_toc)
    }
  })

  const tocFromPercentage = (percent: number) => {
    if (!flattenedToc.value) return {}

    percent /= 100

    for (let i = 0; i < flattenedToc.value.length; i += 1) {
      if (flattenedToc.value[i].percentage > percent) {
        return flattenedToc.value[i - 1]
      }
    }

    return null
  }

  const labelFromPercentage = (percent: number) => {
    let toc = tocFromPercentage(percent)
    if (toc) return toc.label
    return ''
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
            if (!currentLocation.start) return
            const currentPage = book.locations.percentageFromCfi(currentLocation.start.cfi)
            progress.value = Number((currentPage * 100).toFixed(2))
          })
          rendition.value.on('relocated', (location) => {
            const percent = book.locations.percentageFromCfi(location.start.cfi)
            const percentage = Number((percent * 100).toFixed(2))
            progress.value = percentage
            history.value.push(location.start.cfi)
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

  return { progress, changeProgress, labelFromPercentage, goBack }
}
