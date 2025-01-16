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
  <!-- setting -->
  <div class="setting-box">
    <!-- setting -->
    <el-icon class="setting-icon" color="#ccc" @click="setting = true">
      <Setting />
    </el-icon>
    <el-drawer
      v-model="setting"
      title="setting"
      :with-header="false"
      :size="isVscode ? 460 : 420"
    >
      <el-form
        :model="theme"
        label-width="auto"
        style="max-width: 100%"
        class="theme"
      >
        <el-form-item label="Flow">
          <el-radio-group v-model="flow" size="small" style="flex-wrap: nowrap">
            <el-radio-button value="paginated" border> Paged </el-radio-button>
            <el-radio-button value="scrolled-doc" border>
              Scrolled
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Paging Animation">
          <el-switch v-model="animation" />
        </el-form-item>
        <el-form-item label="WritingMode">
          <el-radio-group
            v-model="theme.writingMode"
            size="small"
            style="flex-wrap: nowrap"
          >
            <el-radio-button value="horizontal-tb" border>
              horizontal
            </el-radio-button>
            <el-radio-button value="vertical-rl" border>
              vertical
            </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="View Spread">
          <el-radio-group
            v-model="spread"
            size="small"
            style="flex-wrap: nowrap"
          >
            <el-radio-button value="auto" border> auto </el-radio-button>
            <el-radio-button value="none" border> none </el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="Text Color">
          <el-color-picker v-model="theme.textColor" show-alpha />
          <li
            class="background-color-circle"
            v-for="color in textList"
            :key="color"
            :style="{ backgroundColor: color }"
            @click="theme.textColor = color"
          ></li>
        </el-form-item>
        <el-form-item label="Background Color">
          <el-color-picker v-model="theme.backgroundColor" show-alpha />
          <li
            class="background-color-circle"
            v-for="color in backgroundList"
            :key="color"
            :style="{ backgroundColor: color }"
            @click="theme.backgroundColor = color"
          ></li>
        </el-form-item>
        <el-form-item label="Line Spacing">
          <el-input-number
            v-model="theme.lineSpacing"
            :precision="2"
            :step="0.1"
            :min="1.3"
            :max="2.0"
            size="small"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="Font Size">
          <el-input-number
            v-model="theme.fontSize"
            :step="2"
            :min="10"
            :max="300"
            size="small"
          ></el-input-number>
        </el-form-item>
        <el-form-item label="Font">
          <el-select
            v-model="theme.font"
            class="font-select"
            width="50"
            size="small"
          >
            <el-option
              v-for="{ label, value } in fontFamily"
              :key="value"
              :label="label"
              :value="value"
            >
              <span :style="{ fontFamily: value }">{{ label }}</span>
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Text To Speech">
          <el-switch v-model="isReading" />
        </el-form-item>
        <el-form-item label="Speed">
          <el-select
            class="font-select"
            width="50"
            size="small"
            v-model="speed"
          >
            <el-option
              v-for="(item, index) in speedList"
              :key="index"
              :label="item"
              :value="item"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Voice">
          <el-select
            class="font-select"
            width="50"
            size="small"
            v-model="voiceIndex"
          >
            <el-option
              v-for="(item, index) in voices"
              :key="item.name"
              :label="item.name"
              :value="index"
            >
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="Process Display">
          <el-select
            class="font-select"
            width="50"
            size="small"
            v-model="progressDisplay"
          >
            <el-option
              v-for="item in displayType"
              :key="item"
              :label="item"
              :value="item"
            >
            </el-option>
          </el-select>
        </el-form-item>
      </el-form>
    </el-drawer>
    <!-- searching -->
    <el-icon class="setting-icon" @click="searching = true" color="#ccc">
      <Search />
    </el-icon>
    <el-drawer
      v-model="searching"
      title="search"
      :with-header="false"
      :size="400"
    >
      <el-input
        clearable
        v-model="searchText"
        size="small"
        width="300"
        placeholder="search"
        :suffix-icon="searchText ? '' : Search"
        @keyup.enter="search"
        class="search"
      />
      <el-table
        :key="searchResult.length"
        :show-header="false"
        :data="searchResult"
        @cell-click="onNodeClick"
        height="calc(100% - 26px)"
        v-loading="searchingLoading"
      >
        <el-table-column prop="label">
          <template #default="scope">
            <span v-html="scope.row.label" />
          </template>
        </el-table-column>
      </el-table>
    </el-drawer>
    <!-- info -->
    <el-icon class="setting-icon" color="#ccc" @click="info = true">
      <WarningFilled />
    </el-icon>
    <el-drawer v-model="info" title="search" :with-header="false" :size="400">
      <div v-if="information" class="information">
        <el-image
          :src="information.cover"
          :alt="information.title"
          :preview-src-list="[information.cover]"
        />
        <p v-if="information.title">标题:{{ information.title }}</p>
        <p v-if="information.creator">作者:{{ information.creator }}</p>
        <p v-if="information.publisher">出版社:{{ information.publisher }}</p>
        <p v-if="information.language">语言:{{ information.language }}</p>
        <p v-if="information.pubdate">出版日期:{{ information.pubdate }}</p>
        <p v-if="information.modified_date">
          修改日期:{{ information.modified_date }}
        </p>
        <p v-if="information.description">介绍:{{ information.description }}</p>
      </div>
    </el-drawer>
  </div>
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
      <el-icon title="back" class="back-icon" @click="goBack"
        ><Back
      /></el-icon>
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
import { Search, Setting, Back } from '@element-plus/icons-vue'
import { VueReader as EpubReader } from 'vue-reader'
import { VueReader as BookReader } from 'vue-book-reader'
import useRendition from '@/hooks/useRendition'
import useTheme from '@/hooks/useTheme'
import useSpeak from '@/hooks/useSpeak'
import useSearch from '@/hooks/useSearch'
import useInfo from '@/hooks/useInfo'
import useFlow from '@/hooks/useFlow'
import useSpread from '@/hooks/useSpread'
import useStore from '@/hooks/useStore'
import useVscode from '@/hooks/useVscode'
import useChapter from '@/hooks/useChapter'
import useProgress from '@/hooks/useProgress'
import useAnimation from '@/hooks/useAnimation'
import useLocation from '@/hooks/useLocation'

const { url, type } = useStore()

const { isReading, voiceIndex, voices, speed, speedList } = useSpeak()
const { searching, searchText, searchingLoading, searchResult, search } =
  useSearch()

const theme = useTheme(false)
const [rendition, setRendition] = useRendition()
const vscode = useVscode()

const isVscode = ref(vscode ? true : false)

//theme setting
const setting = ref(false)
const fontFamily = [
  {
    label: 'Arial',
    value: "'Arial', Arimo, Liberation Sans, sans-serif",
  },
  {
    label: 'Lato',
    value: "'Lato', sans-serif",
  },
  {
    label: 'Georgia',
    value: "'Georgia', Liberation Serif, serif",
  },
  {
    label: 'Times New Roman',
    value: "Times New Roman', Tinos, Liberation Serif, Times, serif",
  },
  {
    label: 'Arbutus Slab',
    value: "'Arbutus Slab', serif",
  },
]
const flow = useFlow()
const spread = useSpread()
const animation = useAnimation()

const backgroundList = [
  'rgba(255,255,255,1)',
  'rgba(44,47,49,1)',
  'rgba(233, 216, 188,1)',
  'rgba(197, 231, 207,1)',
]

const textList = [
  'rgba(0,0,0,1)',
  'rgba(255,255,255,1)',
  'rgba(89, 68, 41,1)',
  'rgba(54, 80, 62,1)',
]
//info
const initBook = (rendition) => {
  setRendition(rendition)
}
const info = ref(false)
const information = useInfo()

const onNodeClick = (item) => {
  if (!rendition.value.shadowRoot) {
    rendition.value.display(item.cfi || item.href)
  } else {
    rendition.value.goTo?.(item.cfi)
  }
}

//footer
const displayType = ['location', 'bar', 'chapter']
const progressDisplay = ref(localStorage.getItem('displayType') || 'chapter')
watch(progressDisplay, (display) => {
  localStorage.setItem('displayType', display)
})
const chapter = useChapter()
const location = useLocation()
const { progress, changeProgress, goBack } = useProgress()
</script>
<style scoped>
/* setting */
.book-reader .setting-box {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 5px;
  flex-direction: row-reverse;
}

.setting-box .setting-icon {
  cursor: pointer;
  z-index: 5;
}

.setting-box .setting-icon:hover {
  color: #409efc;
}

.setting-box .information {
  color: #000;
}

.navigation-icon {
  cursor: pointer;
  z-index: 5;
}
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
