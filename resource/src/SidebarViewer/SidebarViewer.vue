<template>
  <div v-if="url" :style="style">
    <book-view :url="url" :getRendition="(val) => (rendition = val)"
      :initOption="{ lastLocation: info!.lastLocation }" />
    <!-- menu tree -->
    <el-popover placement="bottom" :popper-style="{ height: '80%' }" :width="300">
      <template #reference>
        <el-icon class="menu-icon" color="#ccc">
          <Menu />
        </el-icon>
      </template>
      <el-tree :data="toc" :props="{ children: 'subitems' }" @node-click="onNodeClick" class="tree" />
    </el-popover>
    <el-icon class="close-icon" color="#ccc" @click="close">
      <Close />
    </el-icon>
    <!-- footer -->
    <div class="footer">
      <div class="chapter">
        <span :title="chapter" class="chapter-text">
          {{ chapter }}
        </span>
        <div class="process">
          {{ progress + '%' }}
        </div>
      </div>
      <!-- process -->
      <div class="footer-slider">
        <el-icon title="back" class="back-icon" @click="goBack">
          <Back />
        </el-icon>
        <el-slider class="slider" v-model="progress" @change="changeProgress" size="small"
          :format-tooltip="labelFromPercentage"></el-slider>
      </div>
    </div>
  </div>
  <!-- import -->
  <div v-else class="import">
    <el-upload class="select-button" :on-change="onchange" :auto-upload="false"
      accept=".epub,.mobi,.fk8,.azw3,.fb2,.cbz,.pdf" :show-file-list="false">
      <el-button type="primary">select file</el-button>
    </el-upload>
  </div>
</template>
<script setup lang="ts">
import { BookView } from 'vue-book-reader'
import { computed } from 'vue'
import { Back, Close, Menu } from '@element-plus/icons-vue'
import { type UploadFile } from 'element-plus'
import useStore from '@/hooks/useStore'
import { rendition } from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useToc from '@/hooks/useToc'
import useProgress from '@/hooks/useProgress'
import useVscode from '@/hooks/useVscode'
import useChapter from '@/hooks/useChapter'
import useInfo from '@/hooks/useInfo'
import '@/hooks/useKeyboard'

const vscode = useVscode()
const { bookKey, url, addBook } = useStore()
const info = useInfo()
const toc = useToc()
const { progress, changeProgress, labelFromPercentage, goBack } = useProgress()
const chapter = useChapter()
const { theme } = useTheme()

const close = () => {
  bookKey.value = null
  vscode && vscode.postMessage({ type: 'title', content: '' })
}

const onNodeClick = (item) => {
  rendition.value?.goTo(item.href)
}
const style = computed(() => {
  return {
    filter: theme.value.grayscale ? 'grayscale(100%)' : 'none',
    color: theme.value.textColor,
    fontSize: `${theme.value.fontSize}%`,
    opacity: theme.value.opacity,
    width: '100%',
    height: '100vh',
    position: 'relative' as const,
  }
})

const onchange = (file: UploadFile) => {
  addBook(file).then(id => {
    bookKey.value = id
  })
}
</script>

<style scoped lang="scss">
/* sidebar */
.sidebar-reader .reader {
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.sidebar-reader .footer {
  position: absolute;
  bottom: 5px;
  right: 0;
  left: 0;
  z-index: 22;
  margin: auto;
  width: 100%;
}

.footer .footer-slider {
  margin: auto;
  opacity: 0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  transition: opacity 0.3s;
}

.footer .footer-slider .slider {
  width: 80%;
  height: 26px;
}

.footer-slider .back-icon {
  cursor: pointer;
  z-index: 5;
}

.footer .chapter {
  position: absolute;
  bottom: 0;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.3s;
  opacity: 1;
  font-size: 14px;
}

.chapter .chapter-text {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  max-width: 70%;
}

.footer .process {
  position: absolute;
  right: 5px;
  font-weight: bolder;
}

.sidebar-reader .footer:hover .footer-slider {
  opacity: 1;
}

.sidebar-reader .footer:hover .chapter {
  opacity: 0;
}

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
  font-weight: bolder;
}

.import {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.import .select-button {
  margin: 5px auto 0;
}
</style>
