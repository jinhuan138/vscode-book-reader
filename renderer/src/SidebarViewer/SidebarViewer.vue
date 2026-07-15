<template>
  <div v-if="url" :style="style">
    <book-view :url="url" :getRendition="(val) => (rendition = val)"
      :initOption="{ lastLocation: info!.lastLocation }" />
    <!-- menu tree -->
    <el-icon class="menu-icon" color="#ccc" @click="expand = true">
      <Expand />
    </el-icon>
    <el-drawer v-model="expand" direction="ltr" title="TOC" resizable style="min-width: 200px"
      header-class="toc-header">
      <el-tree :data="toc" :props="{ children: 'subitems' }" @node-click="onNodeClick" class="tree" node-key="id"
        :current-node-key="currentToc" highlight-current>
      </el-tree>
    </el-drawer>
    <div class="operation-group">
      <el-icon class="voice" :color="isReading ? '#409efc' : '#ccc'" @click="isReading = !isReading">
        <Headset />
      </el-icon>
      <el-icon class="close" color="#ccc" @click="close">
        <Close />
      </el-icon>
    </div>
    <!-- footer -->
    <div class="footer" @mouseenter="showSlider = true" @mouseleave="showSlider = false">
      <div v-if="!showSlider" class="chapter">
        <span class="chapter-text" :title="chapter">
          {{ chapter }}
        </span>
        <span class="process"> {{ progress }}% </span>
      </div>
      <!-- process -->
      <el-row v-else class="footer-slider" justify="center" align="middle">
        <el-col :span="4">
          <el-icon title="back" class="back-icon" @click="goBack">
            <Back />
          </el-icon>
        </el-col>
        <el-col :span="18">
          <el-slider class="slider" v-model="progress" @change="changeProgress" size="small"
            :format-tooltip="labelFromPercentage"></el-slider>
        </el-col>
      </el-row>
    </div>
  </div>
  <!-- import -->
  <div v-else class="import-file">
    <el-upload class="select-button" :on-change="onchange" :auto-upload="false"
      accept=".epub,.mobi,.fk8,.azw3,.fb2,.cbz,.pdf,.txt" :show-file-list="false">
      <el-button type="primary">select file</el-button>
    </el-upload>
  </div>
</template>
<script setup lang="ts">
import { BookView } from 'vue-book-reader'
import { ref, computed } from 'vue'
import { Headset, Close, Back, Expand, } from '@element-plus/icons-vue'
import { type UploadFile } from 'element-plus'
import useStore from '@/hooks/useStore'
import { rendition, onReady } from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useToc, { type TocItem } from '@/hooks/useToc'
import useProgress from '@/hooks/useProgress'
import useChapter from '@/hooks/useChapter'
import useInfo from '@/hooks/useInfo'
import '@/hooks/useKeyboard'
import localforage from 'localforage'
import useDisguise from '@/hooks/useDisguise'
import useTTS from '@/hooks/useTTS'
const { showBook } = useDisguise()

const { url, addBook, closeBook } = useStore()
const info = useInfo()
const toc = useToc()
const expand = ref(false)
const { progress, changeProgress, labelFromPercentage, goBack } = useProgress()
const chapter = useChapter()
const { theme } = useTheme()
const showSlider = ref(false)
const { isReading } = useTTS()

const close = () => {
  closeBook()
  localforage.removeItem('lastBook')
}

const onNodeClick = (item: TocItem) => {
  rendition.value?.goTo(item.href)
  expand.value = false
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
    display: showBook.value ? 'block' : 'none',
  }
})
const onchange = (file: UploadFile) => {
  addBook(file)
}

const currentToc = ref<number | null>(null)
onReady(() => {
  rendition.value.addEventListener('relocate', ({ detail }) => {
    if (detail.tocItem) {
      currentToc.value = detail.tocItem.id
    } else {
      currentToc.value = null
    }
  })
})
</script>

<style scoped lang="scss">
/* sidebar */
.reader {
  inset: 0 !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
}

.footer {
  position: absolute;
  bottom: 5px;
  left: 0;
  z-index: 1;
  width: 100%;

  .footer-slider {
    .slider {
      height: 26px;
    }

    .back-icon {
      cursor: pointer;
      z-index: 5;
    }
  }

  .chapter {
    font-size: 14px;
    display: flex;
    align-items: center;
    overflow: hidden;
    width: 100%;

    .chapter-text {
      flex: 1;
      overflow: hidden;
      white-space: nowrap;
      text-overflow: ellipsis;
      text-align: center;
    }

    .process {
      font-weight: bolder;
      flex-shrink: 0;
      white-space: nowrap;
      margin-left: 8px;
      font-weight: bolder;
    }
  }
}

.menu-icon,
.operation-group {
  position: absolute;
  z-index: 5;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;

  .close,
  .voice {
    cursor: pointer;
  }
}

.menu-icon {
  left: 5px;
}


.menu-icon:hover,
.close-icon:hover {
  color: #409efc;
}

// toc
:deep(.toc-header) {
  margin-bottom: 0;
}

.tree {
  :deep(.el-tree-node__content) {
    min-height: var(--el-tree-node-content-height);
    height: auto;

    .el-tree-node__expand-icon.is-leaf {
      display: none;
    }

    .el-tree-node__label {
      white-space: normal;
    }
  }
}

.import-file {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;

  .select-button {
    margin: 5px auto 0;
  }
}
</style>
