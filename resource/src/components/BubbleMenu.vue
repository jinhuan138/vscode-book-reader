<template>
  <el-popover :visible="isVisible" popper-class="bubble" :width="170">
    <template #reference>
      <span ref="popRef" style="position: absolute; visibility: hidden">{{ text }}</span>
    </template>
    <el-button-group>
      <el-button :icon="Brush" @click="onHLBtn" v-if="!editAnnotation"></el-button>
      <el-button :icon="Delete" @click="removeAnnotation" v-else></el-button>
      <el-button :icon="CopyDocument" @click="copyText"></el-button>
      <el-popover width="200" trigger="hover">
        <template #reference>
          <el-button :icon="Collection">
          </el-button>
        </template>
        <div class="el-popover__title">
          <el-select v-model="translateTo" placeholder="translateTo" style="width: 100%" size="small"
            @change="translateText" :teleported="false">
            <el-option v-for="(label, code) in lang" :key="code" :label="label" :value="code" />
          </el-select>
        </div>
        {{ translatedText }}
      </el-popover>
    </el-button-group>
    <div class="color-option-container" v-if="isVisible && !editAnnotation">
      <div v-if="!isLine" class="color-option" v-for="color in colorOption"
        :style="{ backgroundColor: color, border: color === highlightColor ? '' : '0px' }"
        @click="highlightColor = color">
      </div>
      <el-icon class="popup-color-more" @click="changeOption">
        <DCaret />
      </el-icon>
      <div v-if="isLine" class="line-option" v-for="color in lineOption"
        :style="{ border: color === highlightColor ? '' : '2px' }" @click="highlightColor = color">
        <div className="demo-line" :style="{ borderBottom: `solid 2px ${color}` }"></div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { Brush, Delete, CopyDocument, Collection, DCaret } from '@element-plus/icons-vue'
import { Overlayer } from 'vue-book-reader/dist/overlayer.js'
import { useClipboard, useTextSelection } from '@vueuse/core'
import { rendition, onReady } from '@/hooks/useRendition'
import useInfo, { type Highlight } from '@/hooks/useInfo'
import useVscode from '@/hooks/useVscode'

const bookInfo = useInfo()
const vscode = useVscode()
const text = ref('')
const colorOption = ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"]
const lineOption = ["#FF0000", "#000080", "#0000FF", "#2EFF2E"]
const isLine = useLocalStorage('isLine', false)
const highlightColor = useLocalStorage('highlightColor', '#FBF1D1')

const isVisible = ref(false)
const cfiRange = ref<Range[] | null>(null)
let currentIndex = 0
const popRef = ref<null | HTMLElement>(null)
const { copy } = useClipboard({ source: text })

const changeOption = () => {
  isLine.value = !isLine.value
  highlightColor.value = isLine.value ? lineOption[0] : colorOption[0]
}

onReady(() => {
  rendition.value.addEventListener("create-overlay", (e) => {
    bookInfo.value!.highlights?.forEach((annotation) => {
      addAnnotation(annotation)
    })
  });

  rendition.value.addEventListener('load', (e) => {
    const { doc, index } = e.detail
    const win = doc.defaultView
    currentIndex = index
    const { text: t, ranges } = useTextSelection({ window: win })
    win.addEventListener('mouseup', () => {
      if (t.value === '') return
      text.value = t.value
      cfiRange.value = ranges.value
      setProps(cfiRange.value[0].getBoundingClientRect())
    })
    win.addEventListener('mousedown', hide)
    win.addEventListener('scroll', hide)
  })
  rendition.value.addEventListener('draw-annotation', (e) => {
    const { draw, annotation } = e.detail
    const { color, type } = annotation
    if (type === 'highlight') draw(Overlayer.highlight, { color })
    else if (type === 'underline') draw(Overlayer.underline, { color })
    else if (type === 'squiggly') draw(Overlayer.squiggly, { color })
  })
  rendition.value.addEventListener("show-annotation", (e) => {
    const annotation = bookInfo.value!.highlights.find((h) => h.value === e.detail.value)!
    highlightClick(annotation, e.detail.range.getBoundingClientRect())
  });
})

const copyText = () => {
  copy(text.value).then(() => {
    ElMessage({
      message: 'copy success',
      type: 'success',
      plain: true,
    })
  })
}
const setProps = (react: DOMRect) => {
  const viewRect = rendition.value.renderer.getBoundingClientRect()
  const reference = popRef.value
  let left = react.left + viewRect.left
  if (left + 170 > window.innerWidth) {
    left = window.innerWidth - 170
  }
  if (left < 0) left = 0
  reference!.style.left = `${left}px`
  reference!.style.top = `${react.y + viewRect.top}px`
  reference!.style.width = react.width + 'px'
  reference!.style.height = react.height + 'px'
  isVisible.value = true
  translateText()
}

const hide = () => {
  isVisible.value = false
  text.value = ''
  translatedText.value = 'No Data'
  cfiRange.value = null
  editAnnotation.value = null
}

const editAnnotation = ref<Highlight | null>(null)
const highlightClick = (annotation: Highlight, react: DOMRect) => {
  editAnnotation.value = annotation
  const { note } = annotation
  text.value = note
  setProps(react)
}
function addAnnotation(annotation: Highlight) {
  rendition.value.addAnnotation(annotation)
}

function removeAnnotation() {
  const { value } = editAnnotation.value!
  rendition.value.addAnnotation(editAnnotation.value!, true)
  hide()
  bookInfo.value!.highlights = bookInfo.value!.highlights.filter(h => h.value !== value)
}
const onHLBtn = () => {
  if (!bookInfo.value!.highlights) {
    bookInfo.value!.highlights = []
  }
  const cfi = rendition.value.getCFI(currentIndex, cfiRange.value![0])
  const annotation = {
    value: cfi,
    type: isLine.value ? 'underline' : 'highlight',
    note: text.value,
    color: highlightColor.value,
  }
  addAnnotation(annotation)
  bookInfo.value!.highlights.push(annotation)
  hide()
}

const translateTo = useLocalStorage('translateTo', 'en')
const translatedText = ref('')
const lang = {
  af: 'Afrikaans',
  am: 'Amharic',
  ar: 'Arabic',
  as: 'Assamese',
  az: 'Azerbaijani',
  ba: 'Bashkir',
  be: 'Belarusian',
  bg: 'Bulgarian',
  bho: 'Bhojpuri',
  bn: 'Bangla',
  bo: 'Tibetan',
  brx: 'Bodo',
  bs: 'Bosnian',
  ca: 'Catalan',
  cs: 'Czech',
  cy: 'Welsh',
  da: 'Danish',
  de: 'German',
  doi: 'Dogri',
  dsb: 'Lower Sorbian',
  dv: 'Divehi',
  el: 'Greek',
  en: 'English',
  es: 'Spanish',
  et: 'Estonian',
  eu: 'Basque',
  fa: 'Persian',
  fi: 'Finnish',
  fil: 'Filipino',
  fj: 'Fijian',
  fo: 'Faroese',
  fr: 'French',
  'fr-CA': 'French (Canada)',
  ga: 'Irish',
  gl: 'Galician',
  gom: 'Konkani',
  gu: 'Gujarati',
  ha: 'Hausa',
  he: 'Hebrew',
  hi: 'Hindi',
  hne: 'Chhattisgarhi',
  hr: 'Croatian',
  hsb: 'Upper Sorbian',
  ht: 'Haitian Creole',
  hu: 'Hungarian',
  hy: 'Armenian',
  id: 'Indonesian',
  ig: 'Igbo',
  ikt: 'Inuinnaqtun',
  is: 'Icelandic',
  it: 'Italian',
  iu: 'Inuktitut',
  'iu-Latn': 'Inuktitut (Latin)',
  ja: 'Japanese',
  ka: 'Georgian',
  kk: 'Kazakh',
  km: 'Khmer',
  kmr: 'Kurdish (Northern)',
  kn: 'Kannada',
  ko: 'Korean',
  ks: 'Kashmiri',
  ku: 'Kurdish (Central)',
  ky: 'Kyrgyz',
  lb: 'Luxembourgish',
  ln: 'Lingala',
  lo: 'Lao',
  lt: 'Lithuanian',
  lug: 'Ganda',
  lv: 'Latvian',
  lzh: 'Chinese (Literary)',
  mai: 'Maithili',
  mg: 'Malagasy',
  mi: 'Māori',
  mk: 'Macedonian',
  ml: 'Malayalam',
  'mn-Cyrl': 'Mongolian (Cyrillic)',
  'mn-Mong': 'Mongolian (Traditional)',
  mni: 'Manipuri',
  mr: 'Marathi',
  ms: 'Malay',
  mt: 'Maltese',
  mww: 'Hmong Daw',
  my: 'Myanmar (Burmese)',
  nb: 'Norwegian',
  ne: 'Nepali',
  nl: 'Dutch',
  nso: 'Sesotho sa Leboa',
  nya: 'Nyanja',
  or: 'Odia',
  otq: 'Querétaro Otomi',
  pa: 'Punjabi',
  pl: 'Polish',
  prs: 'Dari',
  ps: 'Pashto',
  pt: 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  ro: 'Romanian',
  ru: 'Russian',
  run: 'Rundi',
  rw: 'Kinyarwanda',
  sd: 'Sindhi',
  si: 'Sinhala',
  sk: 'Slovak',
  sl: 'Slovenian',
  sm: 'Samoan',
  sn: 'Shona',
  so: 'Somali',
  sq: 'Albanian',
  'sr-Cyrl': 'Serbian (Cyrillic)',
  'sr-Latn': 'Serbian (Latin)',
  st: 'Sesotho',
  sv: 'Swedish',
  sw: 'Swahili',
  ta: 'Tamil',
  te: 'Telugu',
  th: 'Thai',
  ti: 'Tigrinya',
  tk: 'Turkmen',
  'tlh-Latn': 'Klingon (Latin)',
  'tlh-Piqd': 'Klingon (pIqaD)',
  tn: 'Setswana',
  to: 'Tongan',
  tr: 'Turkish',
  tt: 'Tatar',
  ty: 'Tahitian',
  ug: 'Uyghur',
  uk: 'Ukrainian',
  ur: 'Urdu',
  uz: 'Uzbek (Latin)',
  vi: 'Vietnamese',
  xh: 'Xhosa',
  yo: 'Yoruba',
  yua: 'Yucatec Maya',
  yue: 'Cantonese (Traditional)',
  'zh-Hans': 'Chinese Simplified',
  'zh-Hant': 'Chinese Traditional',
  zu: 'Zulu',
}
const translateText = () => {
  if (vscode && text.value) {
    vscode.postMessage({ type: 'translate', content: text.value, to: translateTo.value })
  }
}
window.addEventListener('message', ({ data }) => {
  if (data) {
    switch (data.type) {
      case 'translate':
        translatedText.value = data.content
        break
    }
  }
})
</script>

<style lang="scss" scoped>
.bubble {
  width: 150px;
  padding: 0px;

  @keyframes slide-right {
    0% {
      transform: translateX(30px);
      opacity: 0;
    }

    100% {
      transform: translateX(0px);
      opacity: 1;
    }
  }

  @keyframes slide-left {
    0% {
      transform: translateX(-50px);
      opacity: 0;
    }

    100% {
      transform: translateX(0px);
      opacity: 1;
    }
  }

  .color-option-container {
    width: 90%;
    height: 25px;
    margin: 5px 0;
    padding-bottom: 5px;
    flex-shrink: 0;
    display: flex;
    justify-content: space-around;

    .color-option {
      width: 25px;
      height: 25px;
      border-radius: 50%;
      opacity: 1;
      box-sizing: border-box;
      cursor: pointer;
      animation: slide-left 0.2s ease-in-out 0s 1;
      border: 2px solid rgba(75, 75, 75, 1);
    }

    .popup-color-more {
      display: inline-block;
      width: 10px;
      position: relative;
      right: 3px;
      top: 4px;
      opacity: 0.7;
      cursor: pointer;
    }

    .line-option {
      width: 25px;
      margin-right: 5px;
      margin-top: 5px;
      height: 25px;
      border-radius: 50%;
      opacity: 1;
      box-sizing: border-box;
      position: relative;
      bottom: 5px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      animation: slide-right 0.2s ease-in-out 0s 1;
      border: 2px solid rgba(75, 75, 75, 1);

      .demo-line {
        width: 80%;
        height: 0px;
      }
    }
  }
}
</style>
