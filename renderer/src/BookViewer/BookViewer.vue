<template>
  <div style="height: 100vh;" v-if="url">
    <div v-show="showBook" class="book-viewer" :style="bookStyle">
      <vue-reader :url="url" :getRendition="(val) => (rendition = val)"
        :initOption="{ lastLocation: info!.lastLocation }" />
      <!-- footer -->
      <div class="footer">
        <div v-if="progressDisplay === 'chapter'" class="chapter" :title="chapter">
          {{ chapter }}
        </div>
        <div v-if="progressDisplay === 'location'" class="chapter">
          {{ location }}
        </div>
        <!-- slider -->
        <div v-else-if="progressDisplay === 'bar'" class="footer-slider">
          <el-icon title="back" class="back-icon" @click="goBack">
            <Back />
          </el-icon>
          <el-slider class="slider" v-model="progress" @change="changeProgress"
            :format-tooltip="labelFromPercentage"></el-slider>
        </div>
      </div>
    </div>
    <!-- function -->
    <Panel />
    <BubbleMenu />
    <CodeInterface />
  </div>
  <!-- import -->
  <div v-else class="import-file" v-loading="vscode ? true : false">
    <el-upload v-if="!vscode" class="select-button" :on-change="onchange" :auto-upload="false"
      accept=".epub,.mobi,.fk8,.azw3,.fb2,.cbz,.pdf" :show-file-list="false">
      <el-button type="primary">select file</el-button>
    </el-upload>
  </div>
</template>
<script setup lang="ts">
import { VueReader } from 'vue-book-reader'
import { computed, CSSProperties } from 'vue'
import { Back } from '@element-plus/icons-vue'
import { type UploadFile } from 'element-plus'
import CodeInterface from './components/CodeInterface/CodeInterface.vue'
import Panel from './components/panel/Panel.vue'
import BubbleMenu from '@/components/BubbleMenu.vue'
import { rendition } from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useStore from '@/hooks/useStore'
import useChapter from '@/hooks/useChapter'
import useProgress from '@/hooks/useProgress'
import useLocation from '@/hooks/useLocation'
import useDisguise from '@/hooks/useDisguise'
import useProcessDisplay from '@/hooks/useProcessDisplay'
import '@/hooks/useKeyboard'
import useInfo from '@/hooks/useInfo'
import useVscode from '@/hooks/useVscode'

const { url, addBook } = useStore()
const info = useInfo()
const { showBook } = useDisguise()
const { theme, defaultBackgroundColor, defaultTextColor } = useTheme()

const bookStyle = computed(() => {
  const style: CSSProperties = {
    height: '100%',
    filter: theme.value.grayscale ? 'grayscale(100%)' : 'none',
    fontSize: `${theme.value.fontSize}%`,
    // opacity: theme.opacity,
    '--book-filter': theme.value.grayscale ? 'grayscale(100%)' : 'none',
    '--book-font-size': `${theme.value.fontSize}%`,
    '--book-text-color': defaultTextColor,
    '--book-background-color': defaultBackgroundColor,
  }
  if (theme.value.textColor) {
    style['color'] = theme.value.textColor
    style['--book-text-color'] = theme.value.textColor
  }
  if (theme.value.backgroundColor) {
    style['background-color'] = theme.value.backgroundColor
    style['--book-background-color'] = theme.value.backgroundColor
  }
  return style
})

//footer
const { progressDisplay } = useProcessDisplay()
const chapter = useChapter()
const location = useLocation()
const { progress, changeProgress, labelFromPercentage, goBack } = useProgress()

const vscode = useVscode()
const onchange = (file: UploadFile) => {
  addBook(file)
}
</script>
<style lang="scss" scoped>
/* book viewer */
.book-viewer .reader {
  inset: 50px 0 32px;
}

.book-viewer .reader .epub-container {
  overflow-x: hidden !important;
}

.book-viewer .arrow {
  display: none;
}

/* book reader */
:deep(.readerArea) {
  background: var(--book-background-color, #fff) !important;
  filter: var(--book-filter);

  .epub-container {
    overflow-x: hidden !important;
  }

  .arrow {
    display: none;
  }

  .titleArea {
    color: var(--book-text-color, #000) !important;
  }
}

:deep(.tocArea) {
  background: var(--book-background-color, #ccc);
  color: var(--book-text-color, #000) !important;

  .tocAreaButton {
    background: var(--book-background-color, #ccc);
    color: var(--book-text-color, #000) !important;
  }
}

/* footer */
.footer {
  color: var(--book-text-color, #000) !important;
  position: absolute;
  bottom: 5px;
  right: 0;
  left: 0;
  z-index: 22;
  margin: auto;
}

.footer .el-slider__bar {
  background-color: #ccc;
}

.chapter {
  width: 100%;
  text-align: center;
  align-items: center;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  font-size: 14px;
}

.footer-slider {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.footer-slider .back-icon {
  cursor: pointer;
  z-index: 5;
}

.footer-slider .slider {
  width: 80%;
  height: 26px;
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
