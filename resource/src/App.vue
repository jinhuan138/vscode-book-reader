<template>
  <RouterView />
</template>
<script setup>
//http://element-plus.org/zh-CN/component/overview.html
//https://marketplace.visualstudio.com/manage/publishers/
import * as pdfjsLib from 'pdfjs-dist/build/pdf.min.mjs'
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
</script>
