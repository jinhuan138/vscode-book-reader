import { ref } from 'vue'
import { rendition } from './useRendition'

type SearchResult = {
  pre: string
  match: string
  post: string
  cfi: string
}

export default function useSearch() {
  const searching = ref(false)
  const searchText = ref('')
  const searchResult = ref<SearchResult[]>([])
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
    const tableResults: SearchResult[] = []
    results.forEach(({ subitems }) => {
      subitems.forEach((item) => {
        const { pre, post } = item.excerpt
        tableResults.push({
          pre: String(pre ?? ''),
          match: text,
          post: String(post ?? ''),
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
