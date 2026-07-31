<template>
  <el-popover :visible="isVisible" popper-class="bubble" placement="top"
    :fallback-placements="['bottom', 'right', 'left']"
    :width="noteEditorVisible ? 'min(360px, calc(100vw - 24px))' : 'min(240px, calc(100vw - 24px))'">
    <template #reference>
      <span ref="popRef" style="position: absolute; visibility: hidden">{{ text }}</span>
    </template>
    <el-button-group>
      <el-button :icon="Brush" :title="t('note.highlight')" @click="createAnnotation(false)"
        v-if="!editAnnotation"></el-button>
      <el-button :icon="ChatLineRound" :title="t('note.highlightAndAdd')" @click="createAnnotation(true)"
        v-if="!editAnnotation"></el-button>
      <el-button :icon="Delete" @click="removeAnnotation" v-else></el-button>
      <el-button :icon="ChatLineRound" :title="t('note.edit')" @click="openNoteEditor" v-if="editAnnotation"></el-button>
      <el-button :icon="CopyDocument" @click="copyText"></el-button>
      <el-popover :width="'min(360px, calc(100vw - 24px))'" trigger="click" @show="translateText">
        <template #reference>
          <el-button :icon="Collection" :title="t('translation.title')">
          </el-button>
        </template>
        <div class="translation-header">
          <el-select v-model="translateTo" :placeholder="t('translation.target')" filterable
            style="width: 100%" size="small" @change="translateText" :teleported="false">
            <el-option v-for="option in languageOptions" :key="option.value"
              :label="option.label" :value="option.value" />
          </el-select>
        </div>
        <div class="translation-result">
          <div v-if="translationLoading" class="translation-status">
            {{ t('translation.loading') }}
          </div>
          <div v-else-if="translationError" class="translation-error">
            <span>{{ translationError }}</span>
            <el-button link type="primary" size="small" @click.stop="translateText">
              {{ t('translation.retry') }}
            </el-button>
          </div>
          <template v-else-if="translatedText">
            <div v-if="detectedSourceLabel" class="translation-source">
              {{ t('translation.detectedSource', { language: detectedSourceLabel }) }}
            </div>
            <div class="translation-text">{{ translatedText }}</div>
            <div class="translation-actions">
              <el-button link type="primary" size="small" :icon="CopyDocument" @click.stop="copyTranslation">
                {{ t('translation.copy') }}
              </el-button>
            </div>
          </template>
          <div v-else class="translation-status">{{ t('translation.empty') }}</div>
        </div>
      </el-popover>
    </el-button-group>
    <div v-if="noteEditorVisible" class="note-editor">
      <div class="note-quote" :title="text">{{ text }}</div>
      <el-input v-model="draftNote" type="textarea" :rows="4" resize="vertical"
        :placeholder="t('note.add')" @keydown.stop />
      <div class="note-actions">
        <el-button size="small" @click="closeNoteEditor">{{ t('common.cancel') }}</el-button>
        <el-button size="small" type="primary" @click="saveNote">{{ t('common.save') }}</el-button>
      </div>
    </div>
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
import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { Brush, Delete, CopyDocument, Collection, DCaret, ChatLineRound } from '@element-plus/icons-vue'
import { Overlayer } from 'vue-book-reader/dist/overlayer.js'
import { useClipboard, useTextSelection } from '@vueuse/core'
import { rendition, onReady } from '@/hooks/useRendition'
import useInfo, { type Highlight } from '@/hooks/useInfo'
import useVscode from '@/hooks/useVscode'
import { useI18n } from 'vue-i18n'

const { t, locale } = useI18n()
const bookInfo = useInfo()
const vscode = useVscode()
const text = ref('')
const colorOption = ["#FBF1D1", "#EFEEB0", "#CAEFC9", "#76BEE9"]
const lineOption = ["#FF0000", "#000080", "#0000FF", "#2EFF2E"]
const isLine = useLocalStorage('isLine', false)
const highlightColor = useLocalStorage('highlightColor', '#FBF1D1')

const isVisible = ref(false)
const cfiRange = ref<Range[] | null>(null)
const noteEditorVisible = ref(false)
const draftNote = ref('')
let currentIndex = 0
let currentRect: DOMRect | null = null
const popRef = ref<null | HTMLElement>(null)
const { copy } = useClipboard({ source: text })

const changeOption = () => {
  isLine.value = !isLine.value
  highlightColor.value = isLine.value ? lineOption[0] : colorOption[0]
}

onReady(() => {
  rendition.value.addEventListener("create-overlay", () => {
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
      setProps(getViewportRect(cfiRange.value[0]))
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
    const annotation = bookInfo.value!.highlights.find((h) => h.value === e.detail.value)
    if (annotation) {
      highlightClick(annotation, getViewportRect(e.detail.range))
    }
  });
})

const copyText = () => {
  copy(text.value).then(() => {
    ElMessage({
      message: t('message.copySuccess'),
      type: 'success',
      plain: true,
    })
  })
}

const getViewportRect = (range: Range) => {
  const clientRects = Array.from(range.getClientRects()).filter((rect) => rect.width || rect.height)
  const rect = clientRects[clientRects.length - 1] || range.getBoundingClientRect()
  const frame = range.startContainer.ownerDocument.defaultView?.frameElement as HTMLElement | null

  if (!frame) return rect

  const frameRect = frame.getBoundingClientRect()
  const scaleX = frame.clientWidth ? frameRect.width / frame.clientWidth : 1
  const scaleY = frame.clientHeight ? frameRect.height / frame.clientHeight : 1

  return new DOMRect(
    frameRect.left + rect.left * scaleX,
    frameRect.top + rect.top * scaleY,
    rect.width * scaleX,
    rect.height * scaleY,
  )
}

const setProps = (react: DOMRect) => {
  currentRect = react
  const reference = popRef.value
  reference!.style.left = `${react.left}px`
  reference!.style.top = `${react.top}px`
  reference!.style.width = react.width + 'px'
  reference!.style.height = react.height + 'px'
  isVisible.value = true
}

const hide = () => {
  isVisible.value = false
  text.value = ''
  cfiRange.value = null
  editAnnotation.value = null
  noteEditorVisible.value = false
  draftNote.value = ''
  currentRect = null
  resetTranslation()
}

const editAnnotation = ref<Highlight | null>(null)

const highlightClick = (annotation: Highlight, react: DOMRect) => {
  editAnnotation.value = annotation
  text.value = annotation.quote
  draftNote.value = annotation.note
  noteEditorVisible.value = false
  setProps(react)
}

const openNoteEditor = () => {
  if (!editAnnotation.value) return
  draftNote.value = editAnnotation.value.note
  noteEditorVisible.value = true
  if (currentRect) setProps(currentRect)
}

const closeNoteEditor = () => {
  noteEditorVisible.value = false
  draftNote.value = editAnnotation.value?.note || ''
  if (currentRect) setProps(currentRect)
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

const createAnnotation = (withNote: boolean) => {
  if (!bookInfo.value!.highlights) {
    bookInfo.value!.highlights = []
  }
  if (!cfiRange.value?.[0]) return

  const cfi = rendition.value.getCFI(currentIndex, cfiRange.value[0])
  const now = Date.now()
  const annotation: Highlight = {
    value: cfi,
    type: isLine.value ? 'underline' : 'highlight',
    quote: text.value,
    note: '',
    color: highlightColor.value,
    createdAt: now,
    updatedAt: now,
  }
  addAnnotation(annotation)
  bookInfo.value!.highlights.push(annotation)

  if (withNote) {
    editAnnotation.value = annotation
    draftNote.value = ''
    cfiRange.value = null
    noteEditorVisible.value = true
    if (currentRect) setProps(currentRect)
  } else {
    hide()
  }
}

const saveNote = () => {
  if (!editAnnotation.value || !bookInfo.value) return

  const updated: Highlight = {
    ...editAnnotation.value,
    note: draftNote.value.trim(),
    createdAt: editAnnotation.value.createdAt || Date.now(),
    updatedAt: Date.now(),
  }

  bookInfo.value.highlights = bookInfo.value.highlights.map((highlight) =>
    highlight.value === updated.value ? updated : highlight
  )
  editAnnotation.value = updated
  ElMessage({
    message: t('note.saved'),
    type: 'success',
    plain: true,
  })
  hide()
}

const translateTo = useLocalStorage('translateTo', locale.value.startsWith('zh') ? 'zh-Hans' : 'en')
const translatedText = ref('')
const translationLoading = ref(false)
const translationError = ref('')
const detectedSource = ref('')
const translationCache = new Map<string, { text: string, source: string }>()
let translationRequestSequence = 0
let activeTranslationRequestId = 0
let activeTranslationCacheKey = ''

const lang: Record<string, string> = {
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

const languageOptions = computed(() => {
  let displayNames: Intl.DisplayNames | null = null
  try {
    displayNames = new Intl.DisplayNames([locale.value], { type: 'language' })
  } catch {
    // Fall back to the bundled English labels if the runtime lacks DisplayNames.
  }

  const preferred = locale.value.startsWith('zh')
    ? ['zh-Hans', 'zh-Hant', 'en', 'ja', 'ko']
    : ['en', 'zh-Hans', 'zh-Hant', 'es', 'fr']
  const preferredOrder = new Map(preferred.map((code, index) => [code, index]))

  return Object.entries(lang)
    .map(([value, fallbackLabel]) => {
      let label = fallbackLabel
      try {
        label = displayNames?.of(value) || fallbackLabel
      } catch {
        // Some service-specific language codes are not valid BCP 47 tags.
      }
      return { value, label }
    })
    .sort((a, b) => {
      const aIndex = preferredOrder.get(a.value) ?? Number.MAX_SAFE_INTEGER
      const bIndex = preferredOrder.get(b.value) ?? Number.MAX_SAFE_INTEGER
      return aIndex - bIndex
    })
})

const detectedSourceLabel = computed(() =>
  languageOptions.value.find((option) => option.value === detectedSource.value)?.label || detectedSource.value
)

const getTranslationError = (code: string) => {
  const keyByCode: Record<string, string> = {
    INVALID_INPUT: 'translation.errors.invalidInput',
    TEXT_TOO_LONG: 'translation.errors.textTooLong',
    UNSUPPORTED_LANGUAGE: 'translation.errors.unsupportedLanguage',
    UNAVAILABLE: 'translation.errors.unavailable',
  }
  return t(keyByCode[code] || 'translation.errors.failed')
}

const setTranslationCache = (key: string, value: { text: string, source: string }) => {
  if (translationCache.size >= 50) {
    const oldestKey = translationCache.keys().next().value
    if (oldestKey) translationCache.delete(oldestKey)
  }
  translationCache.set(key, value)
}

const resetTranslation = () => {
  activeTranslationRequestId = ++translationRequestSequence
  activeTranslationCacheKey = ''
  translatedText.value = ''
  detectedSource.value = ''
  translationLoading.value = false
  translationError.value = ''
}

const translateText = () => {
  const sourceText = text.value.trim()
  if (!sourceText) {
    resetTranslation()
    return
  }
  if (!vscode) {
    resetTranslation()
    translationError.value = getTranslationError('UNAVAILABLE')
    return
  }

  const cacheKey = JSON.stringify([sourceText, translateTo.value])
  const cached = translationCache.get(cacheKey)
  if (cached) {
    activeTranslationRequestId = ++translationRequestSequence
    activeTranslationCacheKey = cacheKey
    translatedText.value = cached.text
    detectedSource.value = cached.source
    translationLoading.value = false
    translationError.value = ''
    return
  }

  const requestId = ++translationRequestSequence
  activeTranslationRequestId = requestId
  activeTranslationCacheKey = cacheKey
  translatedText.value = ''
  detectedSource.value = ''
  translationLoading.value = true
  translationError.value = ''
  vscode.postMessage({
    type: 'translate',
    requestId,
    content: sourceText,
    to: translateTo.value,
  })
}

const copyTranslation = () => {
  if (!translatedText.value) return
  copy(translatedText.value).then(() => {
    ElMessage({
      message: t('translation.copySuccess'),
      type: 'success',
      plain: true,
    })
  })
}

window.addEventListener('message', ({ data }) => {
  if (!data || data.type !== 'translate' || data.requestId !== activeTranslationRequestId) return

  translationLoading.value = false
  if (data.error) {
    translatedText.value = ''
    detectedSource.value = ''
    translationError.value = getTranslationError(data.error)
    return
  }

  translatedText.value = data.content || ''
  detectedSource.value = data.from || ''
  translationError.value = translatedText.value ? '' : getTranslationError('TRANSLATE_FAILED')
  if (translatedText.value && activeTranslationCacheKey) {
    setTranslationCache(activeTranslationCacheKey, {
      text: translatedText.value,
      source: detectedSource.value,
    })
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

.translation-header {
  margin-bottom: 10px;
}

.translation-result {
  min-height: 54px;
  max-height: min(320px, calc(100vh - 160px));
  overflow-y: auto;
}

.translation-status {
  padding: 14px 4px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

.translation-error {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  color: var(--el-color-danger);
  background: var(--el-color-danger-light-9);
  border-radius: 4px;
}

.translation-source {
  margin-bottom: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.translation-text {
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
}

.translation-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}

.note-editor {
  margin-top: 10px;

  .note-quote {
    margin-bottom: 8px;
    padding: 6px 8px;
    max-height: 54px;
    overflow: hidden;
    color: var(--el-text-color-secondary);
    background: var(--el-fill-color-light);
    border-radius: 4px;
    font-size: 12px;
    line-height: 18px;
  }

  .note-actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 8px;
  }
}
</style>
