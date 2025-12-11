<template>
  <epub-reader
    v-if="type === 'epub'"
    :url="url"
    :getRendition="initBook"
    :backgroundColor="theme.backgroundColor"
  />
  <book-reader
    v-else
    :url="url"
    :getRendition="initBook"
    :backgroundColor="theme.backgroundColor"
  />
  <Setting v-model:progressDisplay="progressDisplay" />
  <!-- footer -->
  <div
    class="footer"
    :style="{
      color: theme.textColor,
      font: theme.fontSize,
    }"
  >
    <div v-if="progressDisplay === 'chapter'" class="chapter" :title="chapter">
      {{ chapter }}
    </div>
    <div v-if="progressDisplay === 'location'" class="chapter">
      {{ location }}
    </div>
    <!-- slider -->
    <div v-else-if="progressDisplay === 'bar'" class="footer-slider">
      <el-icon title="back" class="back-icon" @click="goBack"><Back /></el-icon>
      <el-slider
        class="slider"
        v-model="progress"
        :step="0.01"
        @change="changeProgress"
      ></el-slider>
    </div>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue'
import { Back } from '@element-plus/icons-vue'
import { VueReader as EpubReader } from 'vue-reader'
import { VueReader as BookReader } from 'vue-book-reader'
import Setting from './Setting.vue'
import useRendition from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useStore from '@/hooks/useStore'
import useChapter from '@/hooks/useChapter'
import useProgress from '@/hooks/useProgress'
import useLocation from '@/hooks/useLocation'

const { url, type } = useStore()

const theme = useTheme(false)
const [rendition, setRendition] = useRendition()
const initBook = (rendition) => {
  setRendition(rendition)
}

//footer
const progressDisplay = ref(localStorage.getItem('displayType') || 'chapter')
watch(progressDisplay, (display) => {
  localStorage.setItem('displayType', display)
})
const chapter = useChapter()
const location = useLocation()
const { progress, changeProgress, goBack } = useProgress()
</script>
<style scoped>
/* footer */
.footer {
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
