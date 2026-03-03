import { ref } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'
import { Book, Toc } from 'epubjs'
export default function useToc() {
  const toc = ref<any[]>([])

  const parshToc = async (book: Book): any[] => {
    await book.locations.generate(1600)
    const { toc } = book.navigation
    const { spine } = book

    /**
     * some epubs not uese standerd href or epubjs fails to process them
     * @param {String} href  The href to validate
     * @returns {String} href
     */
    const validateHref = (href: string) => {
      if (href.startsWith('..')) {
        href = href.substring(2)
      }
      if (href.startsWith('/')) {
        href = href.substring(1)
      }
      return href
    }

    /**
     * Return spin part from href
     *
     * TL;DR
     * Toc item points exact postion of chapter or subChapter by using hase ID
     * in href. In more genrale href looks like ch001#title.
     * The ch001 is spine item and title is element id for which tocitem is.
     * We can get cfi of toc from this two item.
     *
     * @param {String} href - The herf to get spine component
     * @returns {String} - The Spine item href
     */
    const getSpineComponent = (href: string) => {
      return href.split('#')[0]
    }

    /**
     * Returns elementId part of href
     * @param {String} href
     */
    const getPositonComponent = (href: string) => {
      return href.split('#')[1]
    }

    const tocTree: any[] = []

    /**
     * recursively go through toc and parsh it
     * @param {toc} toc
     * @param {parrent} parrent
     */
    const createTree = async (toc: Toc, parrent) => {
      for (let i = 0; i < toc.length; i += 1) {
        const href = validateHref(toc[i].href)

        // get spin and elementId part from href
        const spineComponent = getSpineComponent(href)
        const positonComponent = getPositonComponent(href)

        // get spinItem from href
        const spineItem = spine.get(spineComponent)

        // load spin item
        await spineItem.load(book.load.bind(book))
        // get element by positionComponent which is basically elementId
        const el = spineItem.document.getElementById(positonComponent)
        // get cfi from element
        const cfi = spineItem.cfiFromElement(el)
        // get percent from cfi
        const percentage = book.locations.percentageFromCfi(cfi)
        // toc item which has
        parrent[i] = {
          label: toc[i].label.trim(),
          children: [],
          href,
          cfi,
          percentage,
        }

        // if toc has subitems recursively parsh it
        if (toc[i].subitems) {
          createTree(toc[i].subitems, parrent[i].children)
        }
      }
    }

    await createTree(toc, tocTree)
    return tocTree
  }

  onReady(() => {
    if (isEpub()) {
      rendition.value.book.loaded.navigation.then(async () => {
        toc.value = await parshToc(rendition.value.book)
      })
    } else {
      toc.value = rendition.value.book.toc
    }
  })

  return toc
}
