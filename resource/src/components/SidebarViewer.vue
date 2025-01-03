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
  <!-- process -->
  <div class="sidebar-process" :style="{ color: theme.textColor }">
    {{ progress + '%' }}
  </div>
</template>
<script setup>
import { onMounted } from 'vue'
import { EpubView } from 'vue-reader'
import { BookView } from 'vue-book-reader'
import useStore from '@/hooks/useStore'
import localforage from 'localforage'
import useRendition from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useToc from '@/hooks/useToc'
import useProgress from '@/hooks/useProgress'
import useFlow from '@/hooks/useFlow'
import useVscode from '@/hooks/useVscode'

const vscode = useVscode()

const { url, type } = useStore()

const theme = useTheme(true)
const flow = useFlow(true)

const [rendition, setRendition] = useRendition()

const toc = useToc()

const progress = useProgress()

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
        Object.keys(theme).forEach((key) => {
          theme[key] = newTheme[key]
        })
        break
      case 'flow':
        flow.value = data.content
        break
    }
  }
})
</script>

<style>
/* sidebar */
.sidebar-reader .reader {
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.sidebar-reader .footer {
  max-width: calc(100% - 90px);
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
