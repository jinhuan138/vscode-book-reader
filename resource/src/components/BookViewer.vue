<template>
  <div v-show="showBook" :style="bookStyle">
    <book-reader :url="url" :getRendition="(val) => (rendition = val)" />
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
  <Panel />
  <CodeInterface />
</template>
<script setup>
import { computed, defineAsyncComponent } from 'vue'
import { Back } from '@element-plus/icons-vue'
import CodeInterface from './CodeInterface/Index.vue'
import Panel from './panel/Index.vue'
import { rendition } from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useStore from '@/hooks/useStore'
import useChapter from '@/hooks/useChapter'
import useProgress from '@/hooks/useProgress'
import useLocation from '@/hooks/useLocation'
import useDisguise from '@/hooks/useDisguise'
import useGrayscale from '@/hooks/useGrayscale'
import useProcessDisplay from '@/hooks/useProcessDisplay'
import '@/hooks/useKeyboard'
const { url, type } = useStore()

const BookReader = defineAsyncComponent(() =>
  type.value === 'epub' ? import('vue-reader') : import('vue-book-reader'),
)
const { showBook } = useDisguise()
const { theme, defaultBackgroundColor, defaultTextColor } = useTheme()

const grayscale = useGrayscale()
const bookStyle = computed(() => {
  const style = {
    height: '100%',
    filter: grayscale.value ? 'grayscale(100%)' : 'none',
    fontSize: `${theme.fontSize}%`,
    // opacity: theme.opacity,
    '--book-filter': grayscale.value ? 'grayscale(100%)' : 'none',
    '--book-font-size': `${theme.fontSize}%`,
    '--book-text-color': defaultTextColor,
    '--book-background-color': defaultBackgroundColor,
  }
  if (theme.textColor) {
    style['color'] = theme.textColor
    style['--book-text-color'] = theme.textColor
  }
  if (theme.backgroundColor) {
    style['background-color'] = theme.backgroundColor
    style['--book-background-color'] = theme.backgroundColor
  }
  return style
})

//footer
const { progressDisplay } = useProcessDisplay()
const chapter = useChapter()
const location = useLocation()
const { progress, changeProgress, goBack } = useProgress()
</script>
<style scoped lang="scss">
/* book reader */
:deep(.readerArea) {
  background: var(--book-background-color, #fff) !important;
  filter: var(--book-filter);
  .titleArea {
    font-size: var(--book-font-size);
    color: var(--book-text-color, #000) !important;
  }
}

:deep(.tocArea) {
  background: var(--book-background-color, #ccc);
  font-size: var(--book-font-size);
  color: var(--book-text-color, #000) !important;

  .tocAreaButton {
    background: var(--book-background-color, #ccc);
    font-size: var(--book-font-size);
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
