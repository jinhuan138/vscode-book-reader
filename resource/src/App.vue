<template>
  <div v-if="url" :class="[isSidebar ? 'sidebar-reader' : 'book-reader']">
    <!-- viewer -->
    <book-viewer v-if="!isSidebar" />
    <sidebar-viewer v-else />
    <!-- image preview -->
    <el-image-viewer
      v-if="showPreview"
      :url-list="srcList"
      show-progress
      :initial-index="indexRef"
      hide-on-click-modal
      @close="showPreview = false"
    >
      <template #toolbar="{ actions }">
        <el-icon @click="actions('zoomOut')">
          <ZoomOut />
        </el-icon>
        <el-icon @click="actions('zoomIn', { enableTransition: false, zoomRate: 2 })">
          <ZoomIn />
        </el-icon>
        <el-icon @click="actions('clockwise', { rotateDeg: 180, enableTransition: false })">
          <RefreshRight />
        </el-icon>
        <el-icon @click="actions('anticlockwise')">
          <RefreshLeft />
        </el-icon>
        <el-icon @click="downloadImage(indexRef)">
          <Download />
        </el-icon> </template
    ></el-image-viewer>
  </div>
  <!-- import -->
  <div v-else class="import">
    <div>
      <el-input placeholder="input book url" v-model="inputUrl" clearable>
        <template #append>
          <el-button :icon="Search" @click="url = inputUrl" />
        </template>
      </el-input>
      <el-upload
        class="select-button"
        :on-change="onchange"
        :auto-upload="false"
        accept=".epub,.mobi,.fk8,.azw3,.fb2,.cbz,.pdf"
      >
        <el-button type="primary">select file</el-button>
      </el-upload>
    </div>
  </div>
</template>
<script setup>
//http://element-plus.org/zh-CN/component/overview.html
//https://www.npmjs.com/package/bing-translate-api
//https://marketplace.visualstudio.com/manage/publishers/
import { Download, RefreshLeft, RefreshRight, ZoomIn, ZoomOut, Search } from '@element-plus/icons-vue'
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs'
import { createInstance } from 'localforage'
import { ref, watch } from 'vue'
import useStore from '@/hooks/useStore'
import BookViewer from '@/components/BookViewer.vue'
import SidebarViewer from '@/components/SidebarViewer.vue'
import useImage from '@/hooks/useImage'
import useVscode from '@/hooks/useVscode'
import { isSidebar } from '@/hooks/useSidebar'
import pkg from '../../package.json'
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/legacy/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()
console.log(
  `%c ${pkg.name} %c v`.concat(pkg.version, ' '),
  'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
  'background: skyblue; padding: 1px; border-radius: 0 3px 3px 0; color: #fff',
)
const inputUrl = ref('')
const { srcList, showPreview, indexRef, downloadImage } = useImage()

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
const bookDB = createInstance({
  name: 'bookList',
})
const fileType = (path) => {
  return path.split('.').pop().toLocaleLowerCase()
}
const onchange = (file) => {
  type.value = fileType(file.name)
  url.value = file.raw
  isSidebar.value && bookDB.setItem('lastBook', url.value)
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
