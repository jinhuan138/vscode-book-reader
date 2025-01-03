import { ref } from 'vue'
import useRendition from './useRendition'

const [rendition] = useRendition()
export default function useSearch() {
  const searching = ref(false)
  const searchText = ref('')
  const searchResult = ref<any[]>([])
  const searchingLoading = ref(false)
  const search = async () => {
    const text = searchText.value
    if (!text) return
    if (!rendition.value.shadowRoot) {
      const { book } = rendition.value
      return Promise.all(
        book.spine.spineItems.map((item) =>
          item
            .load(book.load.bind(book))
            .then(item.find.bind(item, text))
            .finally(item.unload.bind(item)),
        ),
      )
        .then((results) => results.flat())
        .then((results) => {
          searchResult.value = results.map((result) => {
            result.label = result.excerpt
              .trim()
              .replace(text, `<span style='color: orange;'>${text}</span>`)
            return result
          })
        })
    } else {
      searchingLoading.value = true
      const generator = await rendition.value.search({
        scope: undefined,
        query: text,
        index: undefined,
      })
      const results: any[] = []
      for await (const result of generator) {
        if (typeof result === 'string') {
          if (result === 'done') {
            searchingLoading.value = false
          }
        } else {
          if (result.progress) {
            console.log('search progress:', result.progress)
          } else {
            results.push(result)
          }
        }
      }
      const tableResults: any[] = []
      results.forEach(({ subitems }) => {
        subitems.forEach((item) => {
          const { pre, post } = item.excerpt
          const label = `${pre}<span style='color: orange;'>${text}</span>${post}`
          tableResults.push({
            label,
            cfi: item.cfi,
          })
        })
      })
      searchResult.value = tableResults
    }
  }
  return {
    searching,
    searchText,
    searchingLoading,
    searchResult,
    search,
  }
}
