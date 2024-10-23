<template>
  <div v-if="url" :class="[isSidebar ? 'sidebar-reader' : 'book-reader']">
    <!-- book viewer -->
    <template v-if="!isSidebar">
      <epub-reader
        v-if="type === 'epub'"
        :url="url"
        :location="location"
        :backgroundColor="theme.backgroundColor"
        :getRendition="getRendition"
        :tocChanged="(val) => (toc = val)"
        @update:location="locationChange"
      />
      <book-reader
        v-else
        :url="url"
        :location="location"
        :backgroundColor="theme.backgroundColor"
        :getRendition="getBookRendition"
        @update:location="locationChange"
      />
    </template>
    <!-- sidebar viewer -->
    <template v-else>
      <EpubView
        v-if="type === 'epub'"
        :url="url"
        :location="location"
        :getRendition="getRendition"
        :tocChanged="(val) => (toc = val)"
        @update:location="locationChange"
      />
      <BookView
        v-else
        :url="url"
        :getRendition="getBookRendition"
        :tocChanged="(val) => (toc = val)"
        @update:location="locationChange"
      />
      <el-popover
        placement="bottom"
        :popper-style="{ height: '80%' }"
        :width="300"
      >
        <template #reference>
          <el-icon class="menu-icon" color="#ccc"><Menu /></el-icon>
        </template>
        <el-tree
          :data="toc"
          :props="{ children: 'subitems' }"
          @node-click="onNodeClick"
          class="tree"
        />
      </el-popover>
      <el-icon class="close-icon" color="#ccc" @click="close"
        ><Close
      /></el-icon>
      <!-- process -->
      <div class="sidebar-process" :style="{ color: theme.textColor }">
        {{ sliderValue + '%' }}
      </div>
    </template>
    <!-- lightbox -->
    <vue-easy-lightbox
      :visible="visibleRef"
      :imgs="imgsRef"
      :index="indexRef"
      @hide="visibleRef = false"
    >
      <template v-slot:close-btn="{ close }">
        <el-icon @click="downloadImage" class="download-image" :size="24"
          ><Download
        /></el-icon>
        <div
          role="button"
          aria-label="close image preview button"
          class="btn__close"
          @click="close"
        >
          <el-icon><CloseBold /></el-icon>
        </div>
      </template>
    </vue-easy-lightbox>
    <!-- setting -->
    <div class="setting-box" v-if="!isSidebar">
      <!-- setting -->
      <el-icon class="setting-icon" color="#ccc" @click="setting = true">
        <Setting />
      </el-icon>
      <el-drawer
        v-model="setting"
        title="setting"
        :with-header="false"
        :size="isVscode ? 460 : 420"
      >
        <el-form
          :model="theme"
          label-width="auto"
          style="max-width: 100%"
          class="theme"
        >
          <el-form-item label="Flow">
            <el-radio-group
              v-model="flow"
              size="small"
              style="flex-wrap: nowrap"
            >
              <el-radio-button value="paginated" border>
                Paged
              </el-radio-button>
              <el-radio-button value="scrolled-doc" border>
                Scrolled
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="View Spread">
            <el-radio-group
              v-model="spread"
              size="small"
              style="flex-wrap: nowrap"
            >
              <el-radio-button value="auto" border> auto </el-radio-button>
              <el-radio-button value="none" border> none </el-radio-button>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="Text Color">
            <el-color-picker v-model="theme.textColor" show-alpha />
            <li
              class="background-color-circle"
              v-for="color in textList"
              :key="color"
              :style="{ backgroundColor: color }"
              @click="theme.textColor = color"
            ></li>
          </el-form-item>
          <el-form-item label="Background Color">
            <el-color-picker v-model="theme.backgroundColor" show-alpha />
            <li
              class="background-color-circle"
              v-for="color in backgroundList"
              :key="color"
              :style="{ backgroundColor: color }"
              @click="theme.backgroundColor = color"
            ></li>
          </el-form-item>
          <el-form-item label="Line Spacing">
            <el-input-number
              v-model="theme.lineSpacing"
              :precision="2"
              :step="0.1"
              :min="1.3"
              :max="2.0"
              size="small"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="Font Size">
            <el-input-number
              v-model="theme.fontSize"
              :step="2"
              :min="10"
              :max="300"
              size="small"
            ></el-input-number>
          </el-form-item>
          <el-form-item label="Font">
            <el-select
              v-model="theme.font"
              class="font-select"
              width="50"
              size="small"
            >
              <el-option
                v-for="{ label, value } in fontFamily"
                :key="value"
                :label="label"
                :value="value"
              >
                <span :style="{ fontFamily: value }">{{ label }}</span>
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Text To Speech">
            <el-switch v-model="isReading" @change="speak" />
          </el-form-item>
          <el-form-item label="Speed">
            <el-select
              class="font-select"
              width="50"
              size="small"
              v-model="speed"
            >
              <el-option
                v-for="(item, index) in speedList"
                :key="index"
                :label="item"
                :value="item"
              >
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Voice">
            <el-select
              class="font-select"
              width="50"
              size="small"
              v-model="voiceIndex"
            >
              <el-option
                v-for="(item, index) in voices"
                :key="item.name"
                :label="item.name"
                :value="index"
              >
              </el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="Process Display">
            <el-select
              class="font-select"
              width="50"
              size="small"
              v-model="progressDisplay"
            >
              <el-option
                v-for="item in displayType"
                :key="item"
                :label="item"
                :value="item"
              >
              </el-option>
            </el-select>
          </el-form-item>
        </el-form>
      </el-drawer>
      <!-- searching -->
      <el-icon class="setting-icon" @click="searching = true" color="#ccc">
        <Search />
      </el-icon>
      <el-drawer
        v-model="searching"
        title="search"
        :with-header="false"
        :size="400"
      >
        <el-input
          clearable
          v-model="searchText"
          size="small"
          width="300"
          placeholder="search"
          :suffix-icon="searchText ? '' : Search"
          @keyup.enter="search"
          class="search"
        />
        <el-table
          :key="searchResult.length"
          :show-header="false"
          :data="searchResult"
          @cell-click="onNodeClick"
          height="calc(100% - 26px)"
        >
          <el-table-column prop="label">
            <template #default="scope">
              <span v-html="scope.row.label" />
            </template>
          </el-table-column>
        </el-table>
      </el-drawer>
      <!-- info -->
      <el-icon class="setting-icon" color="#ccc" @click="info = true">
        <WarningFilled />
      </el-icon>
      <el-drawer v-model="info" title="search" :with-header="false" :size="400">
        <div v-if="information" class="information">
          <el-image
            :src="information.cover"
            :alt="information.title"
            :preview-src-list="[information.cover]"
          />
          <p v-if="information.title">标题:{{ information.title }}</p>
          <p v-if="information.creator">作者:{{ information.creator }}</p>
          <p v-if="information.publisher">出版社:{{ information.publisher }}</p>
          <p v-if="information.language">语言:{{ information.language }}</p>
          <p v-if="information.pubdate">出版日期:{{ information.pubdate }}</p>
          <p v-if="information.modified_date">
            修改日期:{{ information.modified_date }}
          </p>
          <p v-if="information.description">
            介绍:{{ information.description }}
          </p>
        </div>
      </el-drawer>
    </div>
    <!-- footer -->
    <div class="footer">
      <!-- page -->
      <div
        v-if="progressDisplay === 'location'"
        class="page"
        :style="{
          color: theme.textColor,
          fontSize: isSidebar ? '14px' : '16px',
        }"
        :title="page"
      >
        {{ page }}
      </div>
      <!-- slider -->
      <el-slider
        v-else-if="progressDisplay === 'bar'"
        v-model="sliderValue"
        :step="0.01"
        @change="change"
      ></el-slider>
    </div>
  </div>
  <!-- import -->
  <div v-else class="import">
    <div>
      <el-input placeholder="input book url" clearable />
      <el-button class="import-button" size="large" @click="importFile"
        ><input
          v-show="false"
          ref="input"
          type="file"
          :multiple="false"
          accept=".epub,.mobi,.fk8,.azw3,.fb2,.cbz,.pdf"
          @change="onchange"
        />Open a Book</el-button
      >
    </div>
  </div>
</template>
<script setup>
//http://element-plus.org/zh-CN/component/overview.html
//https://www.npmjs.com/package/bing-translate-api
//https://marketplace.visualstudio.com/manage/publishers/
import { VueReader as EpubReader, EpubView } from 'vue-reader'
import { VueReader as BookReader, BookView } from 'vue-book-reader'
import VueEasyLightbox from 'vue-easy-lightbox'
import { Search, Menu, Close } from '@element-plus/icons-vue'
import localforage from 'localforage'
import { ref, reactive, watch, onMounted, onBeforeMount, toRaw } from 'vue'

//vscode
const vscode =
  typeof acquireVsCodeApi != 'undefined' ? acquireVsCodeApi() : null
vscode && vscode.postMessage({ type: 'init' })
const isVscode = ref(typeof acquireVsCodeApi != 'undefined' ? true : false)

onBeforeMount(() => {
  if (vscode) {
    textList.unshift('var(--vscode-editor-foreground) !important')
    backgroundList.unshift('var(--vscode-editor-background) !important')
    theme.textColor = textList[0]
    theme.backgroundColor = backgroundList[0]
  }
  const stored = localStorage.getItem(url.value)
  if (stored && url.value && type.value !== 'epub') {
    location.value = stored
  }
})

window.addEventListener('message', ({ data }) => {
  if (data) {
    if (data.type === 'open') {
      url.value = data.content
      type.value = fileType(data.content)
    } else if (data.type === 'type') {
      isSidebar.value = data.content === 'sidebar'
    } else if (data.type === 'style') {
      const { key, theme: newTheme } = JSON.parse(data.content)
      Object.keys(newTheme).forEach((key) => {
        theme[key] = newTheme[key]
      })
    }
  }
})

//Import file
const isSidebar = ref(false)
const type = ref('')
const bookDB = localforage.createInstance({
  name: 'bookList',
})
watch(
  isSidebar,
  async (val) => {
    if (val) {
      type.value = await bookDB.getItem('lastBookType')
      url.value = await bookDB.getItem('lastBook')
    }
  },
  {
    immediate: true,
  },
)

const defaultBook = 'files/啼笑因缘.epub'
const url = ref(import.meta.env.MODE === 'development' ? defaultBook : '')

const close = () => {
  url.value = ''
  bookDB.removeItem('lastBookType')
  bookDB.removeItem('lastBook')
  vscode && vscode.postMessage({ type: 'title', content: '' })
}
const location = ref('')
const fileType = (path) => {
  const type = path.split('.')
  return type[type.length - 1] || ''
}
const input = ref(null)
const importFile = () => input.value.click()
const onchange = (e) => {
  const file = e.target.files[0]
  type.value = fileType(file.name)
  if (type.value === 'epub') {
    if (window.FileReader) {
      var reader = new FileReader()
      reader.onloadend = () => {
        url.value = reader.result
        isSidebar.value && bookDB.setItem('lastBook', url.value)
      }
      reader.readAsArrayBuffer(file)
    }
  } else {
    url.value = file
    isSidebar.value && bookDB.setItem('lastBook', url.value)
  }
  if (isSidebar.value) {
    bookDB.setItem('lastBookType', type.value)
  }
}
watch(
  url,
  (val) => {
    if (val && typeof val === 'string') {
      type.value = val.split('.').pop()
    }
  },
  { immediate: true },
)

//Image Lightbox
let rendition, book, displayed, bookKey
const imgsRef = ref([])
const indexRef = ref(0)
const visibleRef = ref(false)
const sliderValue = ref(0)
const getRendition = (val) => {
  rendition = val
  book = rendition.book
  bookKey = book.key()
  //image,annotation
  rendition.themes.default({
    img: {
      cursor: 'pointer',
    },
    image: {
      cursor: 'pointer',
    },
  })
  rendition.hooks.content.register(({ document }) => {
    updateStyle(theme)
    imgsRef.value = []
    const imgs = [
      ...document.querySelectorAll('img'),
      ...document.querySelectorAll('image'),
    ]
    imgs.forEach((img, index) => {
      img.addEventListener('click', () => {
        visibleRef.value = true
        indexRef.value = index
      })
      imgsRef.value.push(img.src || img.getAttribute('xlink:href'))
    })
    if (isSidebar.value) {
      const annotation = Array.from(document.querySelectorAll('a'))
      if (annotation.length) {
        const halfLength = Math.floor(annotation.length / 2)
        annotation.slice(0, halfLength).forEach((el) => {
          if (el.href) {
            const id = el.href.split('#')[1]
            const target = annotation.slice(halfLength).find((a) => a.id === id)
            if (target && target.parentNode) {
              el.title = target.parentNode.textContent
            }
          }
        })
      }
    }
  })
  //updateStyles
  rendition.on('relocated', () => {
    rendition.hooks.content.register(() => updateStyle(theme))
  })
  rendition.spread(defaultSpread)
  rendition.flow(defaultFlow === 'paginated' ? 'paginated' : 'scrolled')
  rendition.on('displayError', () => {
    console.err('error rendering book')
    url.value = ''
  })
  //save position
  rendition.on('relocated', (event) => {
    localStorage.setItem(bookKey, event.start.cfi)
  })
  //slider
  const stored = localStorage.getItem(bookKey)
  displayed = rendition.display(stored || 1)
  book.ready
    .then(() => {
      book.loaded.metadata.then(async (metadata) => {
        const cover = await book.coverUrl()
        information.value = { ...metadata, cover }
        vscode &&
          vscode.postMessage({ type: 'title', content: metadata?.title || '' })
      })
      return book.locations.generate(1600)
    })
    .then((locations) => {
      displayed.then(function () {
        var currentLocation = rendition.currentLocation()
        const currentPage = book.locations.percentageFromCfi(
          currentLocation.start.cfi,
        )
        sliderValue.value = (currentPage * 100).toFixed(2)
      })
      rendition.on('relocated', (location) => {
        const percent = book.locations.percentageFromCfi(location.start.cfi)
        const percentage = (percent * 100).toFixed(2)
        sliderValue.value = percentage
      })
      if (stored) {
        location.value = stored
        const percent = book.locations.percentageFromCfi(stored)
        const percentage = (percent * 100).toFixed(2)
        sliderValue.value = percentage
      }
    })
}
const getBookRendition = (val) => {
  bookKey = url.value
  rendition = val
  const { book } = rendition
  const { author } = book.metadata
  const bookAuthor =
    typeof author === 'string'
      ? author
      : (author
          ?.map((author) => (typeof author === 'string' ? author : author.name))
          ?.join(', ') ?? '')
  information.value = {
    ...book.metadata,
    creator: bookAuthor,
    pubdate: book.metadata.published,
  }
  const bookName = book.metadata?.title
    ? book.metadata?.title
    : typeof url.value === 'string'
      ? decodeURIComponent(url.value.substring(url.value.lastIndexOf('/') + 1, url.value.lastIndexOf('.'))) 
      : ''
  vscode &&
    vscode.postMessage({
      type: 'title',
      content: bookName,
    })
  book.getCover?.().then((blob) => {
    information.value.cover = URL.createObjectURL(blob)
  })
  updateStyle(theme)
  rendition.addEventListener('relocate', ({ detail }) => {
    localStorage.setItem(bookKey, detail.cfi)
    const paginator = rendition.shadowRoot.querySelector('foliate-paginator')
    const doc = paginator?.getContents()[0].doc
    if (!doc) return
    imgsRef.value = []
    const imgs = [
      ...doc.querySelectorAll('img'),
      ...doc.querySelectorAll('image'),
    ]
    imgs.forEach((img, index) => {
      img.addEventListener('click', () => {
        visibleRef.value = true
        indexRef.value = index
      })
      imgsRef.value.push(img.src || img.getAttribute('xlink:href'))
    })
  })
}
const change = (val) => {
  if (type.value === 'epub') {
    var cfi = book.locations.cfiFromPercentage(val / 100)
    rendition.display(cfi)
  } else {
    sliderValue.value = val
    rendition.goToFraction(parseFloat(val / 100))
  }
}

const downloadImage = () => {
  var downloadLink = document.createElement('a')
  downloadLink.href = imgsRef.value[indexRef.value]
  downloadLink.download = 'image.jpg'
  downloadLink.style.display = 'none'
  document.body.appendChild(downloadLink)
  downloadLink.click()
  document.body.removeChild(downloadLink)
}
//search
const searching = ref(false)
const searchText = ref('')
const searchResult = ref([])
const search = () => {
  const text = searchText.value
  if (!text) return
  if (type.value === 'epub') {
    const book = rendition.book
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
    console.log(rendition)
  }
}
const onNodeClick = (item) => {
  if (type.value === 'epub') {
    rendition.display(item.cfi || item.href)
  } else {
    rendition.goTo(item.href)
  }
}
//theme
const setting = ref(false)
const defaultFlow = localStorage.getItem('flow') || 'paginated'
const flow = ref(defaultFlow)
const displayType = ['location', 'bar']
const progressDisplay = ref('location')
watch(flow, (value) => {
  localStorage.setItem('flow', value)
  if (type.value === 'epub') {
    rendition.flow(value)
  } else {
    rendition?.renderer.setAttribute(
      'flow',
      value === 'paginated' ? 'paginated' : 'scrolled',
    )
  }
})
const defaultSpread = localStorage.getItem('spread') || 'auto'
const spread = ref(defaultSpread)
watch(spread, (value) => {
  localStorage.setItem('spread', value)
  if (type.value === 'epub') {
    rendition.spread(value)
  } else {
  }
})
const textList = [
  'rgba(0,0,0,1)',
  'rgba(255,255,255,1)',
  'rgba(89, 68, 41,1)',
  'rgba(54, 80, 62,1)',
]
const backgroundList = [
  'rgba(255,255,255,1)',
  'rgba(44,47,49,1)',
  'rgba(233, 216, 188,1)',
  'rgba(197, 231, 207,1)',
]
const userTheme = localStorage.getItem('theme')
const theme = reactive(
  userTheme
    ? JSON.parse(userTheme)
    : {
        fontSize: 100,
        font: '',
        lineSpacing: 1.5,
        textColor: textList[0],
        backgroundColor: backgroundList[0],
      },
)
const fontFamily = [
  {
    label: 'Arial',
    value: "'Arial', Arimo, Liberation Sans, sans-serif",
  },
  {
    label: 'Lato',
    value: "'Lato', sans-serif",
  },
  {
    label: 'Georgia',
    value: "'Georgia', Liberation Serif, serif",
  },
  {
    label: 'Times New Roman',
    value: "Times New Roman', Tinos, Liberation Serif, Times, serif",
  },
  {
    label: 'Arbutus Slab',
    value: "'Arbutus Slab', serif",
  },
]
const getCSS = ({
  font,
  fontSize,
  lineSpacing,
  textColor,
  backgroundColor,
}) => {
  return [
    `
* {
  font-family: ${font || '!invalid-hack'};
  font-size:  ${fontSize}%;
  color: ${textColor};
}

a {
  color: 'inherit !important',
}

a:link: {
  color: '#1e83d2 !important',
}

body {
  font-family: ${font || '!invalid-hack'} !important;
  color: ${textColor} !important;
  background-color: ${backgroundColor} !important;
}

html,body {
  line-height: ${lineSpacing} !important;
  font-size: ${fontSize}% !important;
  color: ${textColor} !important;
  background-color: ${backgroundColor} !important;
  padding: 0 !important;
  column-width: auto !important;
  height: auto !important;
  width: auto !important;
}
svg, img {
  background-color: transparent !important;
  mix-blend-mode: multiply;
}
img, image {
  cursor: pointer !important;
}
`,
  ]
}
const updateStyle = (theme) => {
  const { font, fontSize, lineSpacing, textColor, backgroundColor } = theme
  localStorage.setItem('theme', JSON.stringify(toRaw(theme)))
  // update sidebar style
  !isSidebar.value &&
    vscode &&
    vscode.postMessage({
      type: 'style',
      content: JSON.stringify({ key: bookKey, theme }),
    })
  const rules = {
    body: {
      'font-family': font !== '' ? `${font} !important` : '!invalid-hack',
      color: `${textColor} !important`,
      'background-color': backgroundColor,
    },
    a: {
      color: 'inherit !important',
      'text-decoration': 'none !important',
      '-webkit-text-fill-color': 'inherit !important',
    },
    'a:link': {
      color: `#1e83d2 !important`,
      'text-decoration': 'none !important',
      '-webkit-text-fill-color': `#1e83d2 !important`,
    },
    'a:link:hover': {
      background: 'rgba(0, 0, 0, 0.1) !important',
    },
    '*': {
      'font-family': font !== '' ? `${font} !important` : '!invalid-hack',
      'font-size':
        fontSize !== '' ? `${fontSize}% !important` : '!invalid-hack',
      color: `${textColor} !important`,
      'background-color': backgroundColor,
    },
  }
  if (type.value === 'epub') {
    if (!rendition) return
    rendition.getContents().forEach((content) => {
      content.addStylesheetRules(rules)
    })
  } else {
    rendition?.renderer?.setStyles &&
      rendition.renderer.setStyles(
        getCSS({ font, fontSize, lineSpacing, textColor, backgroundColor }),
      )
  }
}
if (userTheme) {
  const newTheme = JSON.parse(userTheme)
  Object.keys(newTheme).forEach((key) => {
    theme[key] = newTheme[key]
  })
}
watch(theme, (val) => {
  updateStyle(val)
})
//page
const page = ref('')
const toc = ref([])
const getLabel = (toc, href) => {
  let label = 'n/a'
  toc.some((item) => {
    if (item.subitems.length > 0) {
      const subChapter = getLabel(item.subitems, href)
      if (subChapter !== 'n/a') {
        label = subChapter
        return true
      }
    } else if (item.href.includes(href)) {
      label = item.label
      return true
    }
  })
  return label
}
//speak
let isAudioOn = false,
  text = ''
const isReading = ref(false)
const speed = ref(1)
const speedList = ref([
  '0.1',
  '0.2',
  '0.3',
  '0.4',
  '0.5',
  '0.75',
  '1',
  '1.25',
  '1.5',
  '1.75',
  '2',
  '3',
  '4',
  '5',
])

const locationChange = (detail) => {
  if (type.value === 'epub') {
    const range = rendition.getRange(rendition.currentLocation().start.cfi)
    const endRange = rendition.getRange(rendition.currentLocation().end.cfi)
    range.setEnd(endRange.startContainer, endRange.startOffset)
    text = range
      .toString()
      .replace(/\s\s/g, '')
      .replace(/\r/g, '')
      .replace(/\n/g, '')
      .replace(/\t/g, '')
      .replace(/\f/g, '')
    if (detail) {
      const { displayed, href } = rendition.location.start
      if (href !== 'titlepage.xhtml') {
        const label = getLabel(toc.value, href)
        page.value = `${displayed.page}/${displayed.total} ${label}`
      }
    }
  } else {
    const { fraction, range, tocItem } = detail
    const percent = (fraction * 100).toFixed(2)
    sliderValue.value = percent
    const innerText = range?.commonAncestorContainer?.innerText
    if (innerText) {
      text = innerText
        .toString()
        .replace(/\s\s/g, '')
        .replace(/\r/g, '')
        .replace(/\n/g, '')
        .replace(/\t/g, '')
        .replace(/\f/g, '')
    }
    page.value = tocItem.label || ''
  }
}

const speak = (val) => {
  if (val) {
    voice(text, speed.value)
  } else {
    isAudioOn = false
    window.speechSynthesis.cancel()
  }
}

const voice = (text, rate = 1) => {
  isAudioOn = true
  const msg = new SpeechSynthesisUtterance()
  msg.text = text
  msg.voice = window.speechSynthesis.getVoices()[0]
  msg.rate = rate
  window.speechSynthesis.speak(msg)
  msg.onerror = (err) => {
    console.log(err)
  }
  msg.onend = async (event) => {
    if (!isReading.value && !isAudioOn) return
    rendition.next()
    speak()
  }
}

const voices = ref([])
const voiceIndex = ref(0)

const setSpeech = () => {
  return new Promise((resolve, reject) => {
    let synth = window.speechSynthesis
    let id

    id = setInterval(() => {
      if (synth.getVoices().length !== 0) {
        resolve(synth.getVoices())
        clearInterval(id)
      } else {
        // this.setState({ isSupported: false })
      }
    }, 10)
  })
}

onMounted(async () => {
  voices.value = await setSpeech()
})

//info
const info = ref(false)
const information = ref(null)

//request error
const originalOpen = XMLHttpRequest.prototype.open
const onError = (e) => {
  url.value = ''
}
XMLHttpRequest.prototype.open = function (method, requestUrl) {
  if (requestUrl === url.value) {
    this.addEventListener('error', onError)
  }
  originalOpen.apply(this, arguments)
}
</script>
<style>
.book-reader,
.sidebar-reader {
  height: 100vh;
  width: 100%;
  position: relative;
}

.book-reader .reader {
  inset: 50px 0 32px;
}

.book-reader .reader .epub-container {
  overflow-x: hidden !important;
}

.sidebar-reader .reader {
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.book-reader .arrow {
  display: none;
}

/* footer */
.book-reader .footer,
.sidebar-reader .footer {
  position: absolute;
  bottom: 5px;
  right: 0;
  left: 0;
  z-index: 22;
  width: 80%;
  margin: auto;
}

.book-reader .footer .el-slider__bar,
.sidebar-reader .footer .el-slider__bar {
  background-color: #ccc;
}

.book-reader .footer .page,
.sidebar-reader .footer .page {
  width: 100%;
  text-align: center;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
.sidebar-reader .footer {
  max-width: calc(100% - 90px);
}

/* setting */
.book-reader .setting-box {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 5px;
  flex-direction: row-reverse;
}

.setting-box .setting-icon {
  cursor: pointer;
  z-index: 5;
}

.setting-box .setting-icon:hover {
  color: #409efc;
}

.setting-box .information {
  color: #000;
}

.navigation-icon {
  cursor: pointer;
  z-index: 5;
}

.import {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.import .import-button {
  margin: 5px auto 0;
}

.theme .background-color-list {
  margin: 10px 0px 0px;
  width: 100%;
  min-height: 44px;
  padding-bottom: 6px;
}

.theme .background-color-circle {
  display: inline-block;
  width: 35px;
  height: 35px;
  font-size: 20px;
  border-radius: 50%;
  opacity: 1;
  cursor: pointer;
  margin: 7px;
  margin-top: 3px;
  box-sizing: border-box;
  position: relative;
  box-shadow: 0px 0px 2px rgba(0, 0, 0, 0.18);
}
/* sidebar */
.menu-icon,
.close-icon {
  position: absolute;
  cursor: pointer;
  z-index: 5;
  top: 5px;
}
.menu-icon {
  left: 5px;
}
.close-icon {
  right: 5px;
}
.menu-icon:hover,
.close-icon:hover {
  color: #409efc;
}
.tree {
  max-height: 100%;
  max-width: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  word-wrap: wrap;
}
.tree .el-tree-node__content {
  min-height: var(--el-tree-node-content-height);
  height: auto;
}
.tree .el-tree-node__content .el-tree-node__label {
  white-space: normal;
}

.sidebar-process {
  position: absolute;
  bottom: 5px;
  right: 5px;
  font-size: 14px;
  font-weight: bolder;
}
.download-image {
  position: absolute;
  cursor: pointer;
  right: 10px;
  bottom: 20px;
}
</style>
