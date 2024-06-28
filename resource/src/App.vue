<template>
  <div v-if="url" class="book-reader">
    <!-- epub book-->
    <epub-reader
      v-if="type && type === 'epub'"
      :url="url"
      :getRendition="getRendition"
      @update:location="locationChange"
      :epubInitOptions="{ spreads: false }"
    />
    <!-- other type book -->
    <book-reader
      v-else-if="type"
      :url="url"
      :getRendition="getBookRendition"
      @update:location="locationChange"
    />
    <!-- lightbox -->
    <vue-easy-lightbox
      :visible="visibleRef"
      :imgs="imgsRef"
      :index="indexRef"
      @hide="visibleRef = false"
    ></vue-easy-lightbox>
    <!-- slider -->
    <el-slider
      v-model="sliderValue"
      :step="0.01"
      class="slider"
      @change="change"
    ></el-slider>
    <div class="setting-box">
      <!-- setting -->
      <el-icon class="setting-icon" color="#ccc" @click="setting = true">
        <Setting />
      </el-icon>
      <el-drawer
        v-model="setting"
        title="setting"
        :with-header="false"
        :size="250"
      >
        <el-form :model="theme" label-width="auto" style="max-width: 100%">
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
          <el-form-item label="Text color">
            <el-color-picker v-model="theme.textColor" show-alpha />
          </el-form-item>
          <el-form-item label="Background color">
            <el-color-picker v-model="theme.backgroundColor" show-alpha />
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
        :size="250"
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
      <el-drawer v-model="info" title="search" :with-header="false" :size="250">
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
import { VueReader as EpubReader } from 'vue-reader'
import { VueReader as BookReader } from 'vue-book-reader'
import VueEasyLightbox from 'vue-easy-lightbox'
import { Search } from '@element-plus/icons-vue'
import { ref, reactive, watch, computed, onMounted } from 'vue'

//vscode
const vscode =
  typeof acquireVsCodeApi != 'undefined' ? acquireVsCodeApi() : null
vscode && vscode.postMessage({ type: 'init' })

window.addEventListener('message', ({ data }) => {
  if (data && data.type === 'open') {
    url.value = data.content
    type.value = fileType(data.content)
  }
})

//Import file
const url = ref('')
const type = ref('')
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
      reader.onloadend = () => (url.value = reader.result)
      reader.readAsArrayBuffer(file)
    }
  } else {
    url.value = file
  }
}

//Image Lightbox
let rendition, book, displayed
const imgsRef = ref([])
const indexRef = ref(0)
const visibleRef = ref(false)
const sliderValue = ref(0)
const getRendition = (val) => {
  rendition = val
  //image
  rendition.themes.default({
    img: {
      cursor: 'pointer',
    },
    image: {
      cursor: 'pointer',
    },
  })
  rendition.hooks.content.register(({ document }) => {
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
  })
  //slider
  book = rendition.book
  displayed = rendition.display()
  book.ready
    .then(() => {
      book.loaded.metadata.then(async (metadata) => {
        const cover = await book.coverUrl()
        information.value = { ...metadata, cover }
      })
      return book.locations.generate(1600)
    })
    .then((locations) => {
      displayed.then(function () {
        var currentLocation = rendition.currentLocation()
        const currentPage = book.locations.percentageFromCfi(
          currentLocation.start.cfi,
        )
        sliderValue.value = currentPage
      })
      rendition.on('relocated', (location) => {
        const percent = book.locations.percentageFromCfi(location.start.cfi)
        const percentage = Math.floor(percent * 100)
        sliderValue.value = percentage
      })
    })
}
const getBookRendition = (val) => {
  rendition = val
  const { book } = rendition
  const { author } = book.metadata
  const bookAuthor =
    typeof author === 'string'
      ? author
      : author
          ?.map((author) => (typeof author === 'string' ? author : author.name))
          ?.join(', ') ?? ''
  information.value = {
    ...book.metadata,
    creator: bookAuthor,
    pubdate: book.metadata.published,
  }
  book.getCover?.().then((blob) => {
    information.value.cover = URL.createObjectURL(blob)
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
  }else{
    console.log(rendition)
  }
}
const onNodeClick = (item) => rendition.display(item.cfi || item.href)
//theme
const setting = ref(false)
const flow = ref('paginated')
watch(flow, (value) => {
  if (type.value === 'epub') {
    rendition.flow(value)
  } else {
    rendition?.renderer.setAttribute(
      'flow',
      value === 'paginated' ? 'paginated' : 'scrolled',
    )
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
const theme = reactive({
  fontSize: 100,
  font: '',
  lineSpacing: 1.5,
  textColor: textList[0],
  backgroundColor: backgroundList[0],
})
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
}) => [
  `
p {
  font-family: ${font};
  font-size:  ${fontSize}px;
  color: ${textColor};
}

body * {
  font-family: ${font} !important;
  color: ${textColor} !important;
  background-color: ${backgroundColor} !important;
}
html,body {
  line-height: ${lineSpacing} !important;
  font-size: ${fontSize}px !important;
  color: ${textColor} !important;
  background-color: ${backgroundColor} !important;
}
`,
]
const updateStyle = ({
  font,
  fontSize,
  lineSpacing,
  textColor,
  backgroundColor,
}) => {
  const rules = {
    p: {
      'font-family': font !== '' ? `${font} !important` : '!invalid-hack',
      'font-size': fontSize !== '' ? `${fontSize} !important` : '!invalid-hack',
      color: textColor,
    },
    body: {
      'font-family': font !== '' ? `${font} !important` : '!invalid-hack',
      color: textColor,
      'background-color': backgroundColor,
    },
    '*': {
      'line-height': `${lineSpacing} !important`,
      'font-size':
        fontSize !== '' ? `${fontSize}% !important` : '!invalid-hack',
      color: textColor,
    },
  }
  if (type.value === 'epub') {
    if (!rendition) return
    rendition.getContents().forEach((content) => {
      content.addStylesheetRules(rules)
    })
    // rendition.start()
  } else {
    rendition?.renderer.setStyles(getCSS({ font, fontSize, lineSpacing }))
  }
}
watch(theme, (val) => {
  updateStyle(val)
})
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
  } else {
    const { fraction } = detail
    const percent = Math.floor(fraction * 100)
    sliderValue.value = percent
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
</script>
<style>
.book-reader {
  height: 100vh;
}

.book-reader .reader {
  inset: 50px 0 20px;
}
.book-reader .arrow {
  display: none;
}

.book-reader .slider {
  position: absolute;
  bottom: 1rem;
  right: 0;
  left: 0;
  z-index: 22;
  width: 80%;
  margin: auto;
}

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
</style>
