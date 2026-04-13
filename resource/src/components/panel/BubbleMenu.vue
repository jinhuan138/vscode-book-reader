<template>
  <el-popover v-model:visible="isVisible" popper-class="bubble">
    <template #reference>
      <span ref="popRef" style="position: absolute; visibility: hidden">{{ text }}</span>
    </template>
    <el-button-group>
      <el-button :icon="Brush" @click="onHLBtn"></el-button>
      <el-button :icon="CopyDocument" @click="copyText"></el-button>
      <el-popover width="200" trigger="hover">
        <template #reference>
          <el-button :icon="Collection"></el-button>
        </template>
        <div class="el-popover__title">
          <el-select v-model="translateTo" placeholder="translateTo" style="width: 240px">
            <el-option v-for="(label, code) in lang" :key="code" :label="label" :value="code" />
          </el-select>
        </div>
        {{ translatedText }}
      </el-popover>
    </el-button-group>
  </el-popover>
</template>

<script setup lang="ts">
import { useClipboard, useTextSelection } from '@vueuse/core'
import { Brush, CopyDocument, Collection } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { rendition, isEpub } from '@/hooks/useRendition'
import useStore from '@/hooks/useStore'
import { Overlayer } from 'vue-book-reader/dist/overlayer.js'
import useVscode from '@/hooks/useVscode'
const { bookInfo } = useStore()
const vscode = useVscode()
const text = ref('')

const isVisible = ref(false)
const cfiRange = ref<Range[] | null>(null)
let currentIndex = 0
const popRef = ref<null | HTMLElement>(null)
const { copy } = useClipboard({ source: text })

const init = (win: Window) => {
  if (!win) return
  const { text: t, rects, ranges } = useTextSelection({ window: win })
  win.addEventListener('mouseup', () => {
    if (t.value === '') return
    text.value = t.value
    setProps(rects.value[0], ranges.value)
    isVisible.value = true
  })
  win.addEventListener('mousedown', hide)
  win.addEventListener('scroll', hide)
}

if (isEpub()) {
  rendition.value.themes.default({
    body: {
      '-webkit-touch-callout': 'none' /* iOS Safari */,
      '-webkit-user-select': 'none' /* Safari */,
      '-khtml-user-select': 'none' /* Konqueror HTML */,
      '-moz-user-select': 'none' /* Firefox */,
      '-ms-user-select': 'none' /* Internet Explorer/Edge */,
      'user-select': 'none',
    },
  })
  bookInfo.value!.highlights?.forEach((annotation) => {
    rendition.value.annotations.highlight(annotation.value)
  })
  rendition.value.on('rendered', (e: Event, iframe: any) => {
    const win = iframe?.iframe?.contentWindow
    init(win)
  })
} else {
  bookInfo.value!.highlights?.forEach((annotation) => {
    rendition.value.addAnnotation(annotation)
  })
  rendition.value.addEventListener('load', (e) => {
    const { doc, index } = e.detail
    const win = doc.defaultView
    currentIndex = index
    init(win)
  })
  rendition.value.addEventListener('draw-annotation', (e) => {
    const { draw, annotation } = e.detail
    const { color, type } = annotation
    if (type === 'highlight') draw(Overlayer.highlight, { color })
    else if (type === 'underline') draw(Overlayer.underline, { color })
    else if (type === 'squiggly') draw(Overlayer.squiggly, { color })
  })
}
const copyText = () => {
  copy(text.value).then(() => {
    ElMessage({
      message: 'copy success',
      type: 'success',
      plain: true,
    })
  })
}
const setProps = (react: DOMRect, cfiRangeValue: Range[]) => {
  const viewRect = isEpub()
    ? rendition.value.manager.container.getBoundingClientRect()
    : rendition.value.renderer.getBoundingClientRect()
  const reference = popRef.value

  reference!.style.left = `${react.x + viewRect.x - (rendition.value.manager.scrollLeft || 0)}px`
  reference!.style.top = `${react.y + viewRect.y}px`
  reference!.style.width = react.width + 'px'
  reference!.style.height = react.height + 'px'
  cfiRange.value = cfiRangeValue
  translateText()
}

const hide = () => {
  isVisible.value = false
  text.value = ''
  translatedText.value = 'No Data'
  cfiRange.value = null
}
const onHLBtn = () => {
  if (!bookInfo.value!.highlights) {
    bookInfo.value!.highlights = []
  }
  if (isEpub()) {
    const [contents] = rendition.value.getContents()
    const cfi = contents.cfiFromRange(cfiRange.value![0])
    const annotation = {
      value: cfi,
      note: text.value,
    }
    rendition.value.annotations.highlight(cfi)
    bookInfo.value!.highlights.push(annotation)
  } else {
    const cfi = rendition.value.getCFI(currentIndex, cfiRange.value)
    const annotation = {
      value: cfi,
      type: 'highlight',
      color: 'red',
      note: text.value,
    }
    rendition.value.addAnnotation(annotation)
    bookInfo.value!.highlights.push(annotation)
  }
}

const translateTo = ref('en')
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
  vscode && vscode.postMessage({ type: 'translate', content: text.value, to: translateTo.value })
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
  padding: 0px;
}
</style>
