<template>
  <div v-if="url" :class="[isSidebar ? 'sidebar-reader' : 'book-reader']">
    <!-- viewer -->
    <book-viewer v-if="!isSidebar" />
    <sidebar-viewer v-else />
    <!-- lightbox -->
    <vue-easy-lightbox
      :visible="visibleRef"
      :imgs="imgsRef"
      :index="indexRef"
      @hide="visibleRef = false"
      @on-index-change="(oldIndex, newIndex) => (indexRef = newIndex)"
    >
      <template v-slot:close-btn="{ close }">
        <el-icon @click="downloadImage" class="download-image" :size="24">
          <Download />
        </el-icon>
        <div
          role="button"
          aria-label="close image preview button"
          class="btn__close"
          @click="close"
        >
          <el-icon>
            <CloseBold />
          </el-icon>
        </div>
      </template>
    </vue-easy-lightbox>
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
import VueEasyLightbox from 'vue-easy-lightbox'
import localforage from 'localforage'
import { ref, watch } from 'vue'
import useStore from '@/hooks/useStore'
import BookViewer from '@/components/BookViewer.vue'
import SidebarViewer from '@/components/SidebarViewer.vue'
import useImage from '@/hooks/useImage'
import useVscode from '@/hooks/useVscode'
import pkg from '../../package.json'
console.log(
  `%c ${pkg.name} %c v`.concat(pkg.version, ' '),
  'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
  'background: skyblue; padding: 1px; border-radius: 0 3px 3px 0; color: #fff',
)
const isSidebar = ref(false)
const { imgsRef, indexRef, visibleRef, downloadImage } = useImage()

const { url, type } = useStore()

const vscode = useVscode()
vscode && vscode.postMessage({ type: 'init' })

window.addEventListener('message', ({ data }) => {
  if (data) {
    switch (data.type) {
      case 'open':
        url.value = data.content
        type.value = fileType(data.content)
        break
      case 'type':
        isSidebar.value = data.content === 'sidebar'
        break
    }
  }
})

//Import file
const bookDB = localforage.createInstance({
  name: 'bookList',
})
const fileType = (path) => {
  return path.split('.').pop().toLocaleLowerCase()
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
watch(isSidebar, async (value) => {
  if (value && !url.value) {
    type.value = (await bookDB.getItem('lastBookType')) || ''
    url.value = (await bookDB.getItem('lastBook')) || ''
  }
})
</script>
<style scoped>
.download-image {
  position: absolute;
  cursor: pointer;
  right: 10px;
  bottom: 20px;
}
</style>
