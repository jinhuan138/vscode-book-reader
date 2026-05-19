<template>
  <div v-if="url" :style="style">
    <book-view :url="url" :getRendition="(val) => (rendition = val)"
      :initOption="{ lastLocation: info!.lastLocation }" />
    <!-- menu tree -->
    <el-icon ref="menuButtonRef" class="menu-icon" color="#ccc" v-click-outside="onClickOutside">
      <Menu />
    </el-icon>
    <el-popover ref="menuPopoverRef" :virtual-ref="menuButtonRef" placement="bottom" :popper-style="{ height: '80%' }"
      :width="300">
      <el-tree :data="toc" :props="{ children: 'subitems' }" @node-click="onNodeClick" class="tree" />
    </el-popover>
    <el-icon class="close-icon" color="#ccc" @click="close">
      <Close />
    </el-icon>
    <!-- footer -->
    <div class="footer" @mouseenter="showSlider = true" @mouseleave="showSlider = false">
      <div v-if="!showSlider" class="chapter">
        <span class="chapter-text" :title="chapter">
          {{ chapter }}
        </span>
        <span class="process">
          {{ progress }}%
        </span>
      </div>
      <!-- process -->
      <el-row v-else class="footer-slider">
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
  <div v-else class="import">
    <el-upload class="select-button" :on-change="onchange" :auto-upload="false"
      accept=".epub,.mobi,.fk8,.azw3,.fb2,.cbz,.pdf" :show-file-list="false">
      <el-button type="primary">select file</el-button>
    </el-upload>
  </div>
</template>
<script setup lang="ts">
import { BookView } from 'vue-book-reader'
import { ref, computed } from 'vue'
import { Back, Close, Menu } from '@element-plus/icons-vue'
import { ClickOutside as vClickOutside, type UploadFile } from 'element-plus'
import useStore from '@/hooks/useStore'
import { rendition } from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useToc from '@/hooks/useToc'
import useProgress from '@/hooks/useProgress'
import useVscode from '@/hooks/useVscode'
import useChapter from '@/hooks/useChapter'
import useInfo from '@/hooks/useInfo'
import '@/hooks/useKeyboard'
import localforage from 'localforage'

const vscode = useVscode()
const { bookKey, url, addBook } = useStore()
const info = useInfo()
const toc = useToc()
const { progress, changeProgress, labelFromPercentage, goBack } = useProgress()
const chapter = useChapter()
const { theme } = useTheme()
const showSlider = ref(false)

const close = () => {
  rendition.value?.close()
  bookKey.value = null
  url.value = null
  rendition.value = null
  vscode && vscode.postMessage({ type: 'title', content: '' })
  localforage.removeItem('lastBook')
}

const menuButtonRef = ref()
const menuPopoverRef = ref()
const onClickOutside = () => {
  menuPopoverRef.value?.hide()
}
const onNodeClick = (item) => {
  rendition.value?.goTo(item.href)
  menuPopoverRef.value?.hide()
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
  addBook(file)
}
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

  .el-tree-node__content {
    min-height: var(--el-tree-node-content-height);
    height: auto;

    .el-tree-node__label {
      white-space: normal;
    }
  }
}

.import {
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
