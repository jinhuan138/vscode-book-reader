<template>
  <div v-if="url" class="book-reader">
    <vue-reader
      :url="url"
      :getRendition="getRendition"
      :epubInitOptions="{ spreads: false }"
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
    <!-- setting -->
    <el-icon class="setting-icon" color="#ccc" @click="setting = true"
      ><Setting
    /></el-icon>
    <el-drawer v-model="setting" title="search">
      <!-- search -->
      <el-input
        clearable
        v-model="searchText"
        size="small"
        width="300"
        placeholder="search"
        :suffix-icon="searchText ? '' : Search"
        @keyup.enter="search"
      />
      <el-table
        :key="searchResult.length"
        :show-header="false"
        :data="searchResult"
        @cell-click="onNodeClick"
      >
        <el-table-column prop="label">
          <template #default="scope">
            <span v-html="scope.row.label" />
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
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
          accept=".epub"
          @change="onchange"
        />Open a Book</el-button
      >
    </div>
  </div>
</template>
<script setup>
//http://element-plus.org/zh-CN/component/overview.html
//https://www.npmjs.com/package/bing-translate-api
import { VueReader } from 'vue-reader'
import VueEasyLightbox from 'vue-easy-lightbox'
import { Search } from '@element-plus/icons-vue'
import { ref } from 'vue'

//vscode
const vscode =
  typeof acquireVsCodeApi != 'undefined' ? acquireVsCodeApi() : null
vscode && vscode.postMessage({ type: 'init' })

window.addEventListener('message', ({ data }) => {
  if (data && data.type === 'open') {
    url.value = data.content
  }
})

//Import file
const url = ref('alice.epub')
const input = ref(null)
const importFile = () => input.value.click()
const onchange = (e) => {
  const file = e.target.files[0]
  if (window.FileReader) {
    var reader = new FileReader()
    reader.onloadend = () => (url.value = reader.result)
    reader.readAsArrayBuffer(file)
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
const change = (val) => {
  var cfi = book.locations.cfiFromPercentage(val / 100)
  rendition.display(cfi)
}
//setting
const setting = ref(true)

//search
const searchText = ref('')
const searchResult = ref([])
const search = () => {
  const text = searchText.value
  if (!text) return
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
          .replace(
            text,
            `<span style='color: orange;'>${text}</span>`,
          )
        return result
      })
    })
}
const onNodeClick = (item) => {
  rendition.display(item.cfi || item.href)
}
</script>
<style>
.book-reader {
  height: 100vh;
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

.book-reader .setting-icon {
  position: absolute;
  right: 1rem;
  top: 1rem;
  cursor: pointer;
  z-index: 5;
}

.book-reader .setting-icon:hover {
  color: #409efc;
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
