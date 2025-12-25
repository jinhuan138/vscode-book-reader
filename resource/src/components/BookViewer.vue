<template>
  <div v-show="showBook" style="height: 100%" :style="style">
    <epub-reader v-if="type === 'epub'" :url="url" :getRendition="initBook" />
    <book-reader v-else :url="url" :getRendition="initBook" />
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
        <el-slider class="slider" v-model="progress" :step="0.01" @change="changeProgress"></el-slider>
      </div>
    </div>
  </div>
  <panel />
  <CodeInterface />
</template>
<script setup>
import { computed } from 'vue'
import { Back } from '@element-plus/icons-vue'
import { VueReader as EpubReader } from 'vue-reader'
import { VueReader as BookReader } from 'vue-book-reader'
import CodeInterface from './CodeInterface/Index.vue'
import panel from './panel/Index.vue'
import useRendition from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useStore from '@/hooks/useStore'
import useChapter from '@/hooks/useChapter'
import useProgress from '@/hooks/useProgress'
import useLocation from '@/hooks/useLocation'
import useDisguise from '@/hooks/useDisguise'
import useGrayscale from '@/hooks/useGrayscale'
import useProcessDisplay from '@/hooks/useProcessDisplay'
import useKeyboard from '@/hooks/useKeyboard'

const { url, type } = useStore()
const { showBook } = useDisguise()
const { theme } = useTheme(false)
const [rendition, setRendition] = useRendition()
const initBook = (rendition) => {
  setRendition(rendition)
}
const grayscale = useGrayscale()
const style = computed(() => {
  return {
    filter: grayscale.value ? 'grayscale(100%)' : 'none',
    color: theme.textColor,
    fontSize: `${theme.fontSize}%`,
    // opacity: theme.opacity,
    '--book-filter': grayscale.value ? 'grayscale(100%)' : 'none',
    '--book-text-color': theme.textColor,
    '--book-background-color': theme.backgroundColor,
    '--book-font-size': `${theme.fontSize}%`,
  }
})

//footer
const { progressDisplay } = useProcessDisplay()
const chapter = useChapter()
const location = useLocation()
const { progress, changeProgress, goBack } = useProgress()
</script>
<style scoped>
/* book reader */
:deep(.readerArea) {
  background: var(--book-background-color) !important;
  filter: var(--book-filter) !important;
}

:deep(.readerArea .titleArea) {
  font-size: var(--book-font-size) !important;
  color: var(--book-text-color) !important;
  /* opacity: var(--book-opacity); */
}

:deep(.tocArea) {
  font-size: var(--book-font-size) !important;
  color: var(--book-text-color) !important;
  background: var(--book-background-color) !important;
  /* opacity: var(--book-opacity); */
}

:deep(.tocAreaButton) {
  font-size: var(--book-font-size) !important;
  color: var(--book-text-color) !important;
}

/* footer */
.footer {
  color: var(--book-text-color) !important;
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
  font: 14px;
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
</style>
