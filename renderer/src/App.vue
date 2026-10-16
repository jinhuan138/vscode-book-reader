<template>
  <el-config-provider :locale="elementPlusLocale">
    <div style="height: 100vh" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave">
      <BookViewer v-if="!isSidebar" />
      <SidebarViewer v-else />
      <ImageViewer />
    </div>
  </el-config-provider>
</template>
<script setup lang="ts">
//http://element-plus.org/zh-CN/component/overview.html
//https://marketplace.visualstudio.com/manage/publishers/
import BookViewer from '@/BookViewer/BookViewer.vue'
import SidebarViewer from '@/SidebarViewer/SidebarViewer.vue'
import ImageViewer from '@/components/ImageViewer.vue'
import { isSidebar } from '@/hooks/useSidebar'
import useDisguise from '@/hooks/useDisguise'
import useVscode from '@/hooks/useVscode'
import pkg from '../../package.json'
import '@/hooks/useMessage'
import { elementPlusLocale } from '@/locales'

console.log(
  `%c ${pkg.name} %c v`.concat(pkg.version, ' '),
  'background: #35495e; padding: 1px; border-radius: 3px 0 0 3px; color: #fff',
  'background: skyblue; padding: 1px; border-radius: 0 3px 3px 0; color: #fff',
)
const vscode = useVscode()
vscode && vscode.postMessage({ type: 'init' })
const { codeDisguise, active } = useDisguise()
const handleMouseEnter = () => {
  if (codeDisguise.value) active.value = true
}
const handleMouseLeave = () => {
  if (codeDisguise.value) active.value = false
}
</script>
