<template>
  <EpubView v-if="type === 'epub'" :url="url" :getRendition="setRendition" />
  <BookView v-else :url="url" :getRendition="setRendition" />
  <!-- menu tree -->
  <el-popover placement="bottom" :popper-style="{ height: '80%' }" :width="300">
    <template #reference>
      <el-icon class="menu-icon" color="#ccc">
        <Menu />
      </el-icon>
    </template>
    <el-tree
      :data="toc"
      :props="{ children: 'subitems' }"
      @node-click="onNodeClick"
      class="tree"
    />
  </el-popover>
  <el-icon class="close-icon" color="#ccc" @click="close">
    <Close />
  </el-icon>
  <!-- footer -->
  <div
    class="footer"
    :style="{
      color: theme.textColor,
      font: theme.fontSize,
    }"
  >
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
      <el-icon title="back" class="back-icon" @click="goBack"><Back /></el-icon>
      <el-slider
        class="slider"
        v-model="progress"
        :step="0.01"
        @change="changeProgress"
        size="small"
      ></el-slider>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from 'vue'
import { EpubView } from 'vue-reader'
import { BookView } from 'vue-book-reader'
import { Back, Close, Menu } from '@element-plus/icons-vue'
import useStore from '@/hooks/useStore'
import localforage from 'localforage'
import useRendition from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useToc from '@/hooks/useToc'
import useProgress from '@/hooks/useProgress'
import useFlow from '@/hooks/useFlow'
import useVscode from '@/hooks/useVscode'
import useChapter from '@/hooks/useChapter'
import useAnimation from '@/hooks/useAnimation'
import useInfo from '@/hooks/useInfo'

const vscode = useVscode()

const { url, type } = useStore()

const theme = useTheme(true)
const flow = useFlow(true)
const animation = useAnimation(true)
const information = useInfo()

const [rendition, setRendition] = useRendition()

const toc = useToc()

const { progress, changeProgress, goBack } = useProgress()

const chapter = useChapter()

//store last book
const bookDB = localforage.createInstance({
  name: 'bookList',
})
const close = () => {
  url.value = ''
  bookDB.removeItem('lastBookType')
  bookDB.removeItem('lastBook')
  vscode && vscode.postMessage({ type: 'title', content: '' })
}

onMounted(async () => {
  if (!url.value) {
    type.value = await bookDB.getItem('lastBookType')
    url.value = await bookDB.getItem('lastBook')
  }
})

const onNodeClick = (item) => {
  if (!rendition.value.shadowRoot) {
    rendition.value?.display(item.cfi || item.href)
  } else {
    rendition.value?.goTo(item.href)
  }
}

window.addEventListener('message', ({ data }) => {
  if (data) {
    switch (data.type) {
      case 'style':
        const newTheme = JSON.parse(data.content)
        Object.keys(newTheme).forEach((key) => {
          theme[key] = newTheme[key]
        })
        break
      case 'flow':
        flow.value = data.content
        break
      case 'animation':
        animation.value = JSON.parse(data.content)
        break
    }
  }
})
</script>

<style scoped>
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
</style>
