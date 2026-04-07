<template>
  <div v-if="url" :class="[isSidebar ? 'sidebar-reader' : 'book-reader']">
    <!-- viewer -->
    <book-viewer />
    <!--image viewer  -->
    <image-viewer />
  </div>
  <!-- import -->
  <div v-else class="import">
    <div>
      <el-input placeholder="input book url" v-model="inputUrl" clearable>
        <template #append>
          <el-button :icon="Search" @click="url = inputUrl" />
        </template>
      </el-input>
      <el-upload class="select-button" :on-change="onchange" :auto-upload="false"
        accept=".epub,.mobi,.fk8,.azw3,.fb2,.cbz,.pdf">
        <el-button type="primary">select file</el-button>
      </el-upload>
    </div>
  </div>
</template>
<script setup>
//http://element-plus.org/zh-CN/component/overview.html
//https://www.npmjs.com/package/bing-translate-api
//https://marketplace.visualstudio.com/manage/publishers/
import ImageViewer from './components/panel/ImageViewer.vue'
import { Search } from '@element-plus/icons-vue'
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs'
import { ref, defineAsyncComponent } from 'vue'
import useStore from '@/hooks/useStore'
import useVscode from '@/hooks/useVscode'
import { isSidebar } from '@/hooks/useSidebar'
import pkg from '../../package.json'

const BookViewer = defineAsyncComponent(() =>
  isSidebar.value ? import('@/components/SidebarViewer.vue') : import('@/components/BookViewer.vue'),
)
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

const { url } = useStore()

const vscode = useVscode()
vscode && vscode.postMessage({ type: 'init' })

window.addEventListener('message', ({ data }) => {
  if (data) {
    switch (data.type) {
      case 'open':
        url.value = data.content
        break
      case 'type':
        isSidebar.value = data.content === 'sidebar'
        break
    }
  }
})

const onchange = (file) => {
  url.value = file.raw
}
</script>
