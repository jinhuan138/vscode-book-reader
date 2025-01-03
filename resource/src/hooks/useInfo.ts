import { ref, watch } from 'vue'
import useVscode from './useVscode'
import useRendition from './useRendition'
const vscode = useVscode()

const [rendition] = useRendition()

const postMessage = (title: string) => {
  if (vscode) {
    vscode.postMessage({
      type: 'title',
      content: title,
    })
  }
}

export default function useInfo() {
  const information = ref<any>(null)
  watch(rendition, (instance) => {
    if (!instance.shadowRoot) {
      const { book } = instance
      book.ready.then(() => {
        book.loaded.metadata.then(async (metadata) => {
          const cover = await book.coverUrl()
          information.value = { ...metadata, cover }
          postMessage(metadata?.title || '')
        })
      })
    } else {
      const { book } = instance
      const { author } = book.metadata
      const bookAuthor =
        typeof author === 'string'
          ? author
          : (author
              ?.map((author) =>
                typeof author === 'string' ? author : author.name,
              )
              ?.join(', ') ?? '')
      information.value = {
        ...book.metadata,
        creator: bookAuthor,
        pubdate: book.metadata.published,
      }

      book.getCover?.().then((blob) => {
        information.value.cover = URL.createObjectURL(blob)
      })
      const bookName = book.metadata?.title || ''
      postMessage(bookName)
    }
  })

  return information
}
