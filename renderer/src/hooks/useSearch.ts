import { ref } from 'vue'
import { rendition } from './useRendition'

export default function useSearch() {
  const searching = ref(false)
  const searchText = ref('')
  const searchResult = ref<any[]>([])
  const searchingLoading = ref(false)
  const search = async () => {
    const text = searchText.value
    if (!text) return
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
  return {
    searching,
    searchText,
    searchingLoading,
    searchResult,
    search,
  }
}
