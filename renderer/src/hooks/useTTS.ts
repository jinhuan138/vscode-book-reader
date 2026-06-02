import { ref, computed, watch, onBeforeMount, onUnmounted } from 'vue'
import { useSpeechSynthesis } from '@vueuse/core'
import { rendition } from './useRendition'

type Segment = { mark: string | null; text: string }

/** 解析 SSML，提取语言和分段列表 */
function parseSSML(ssml: string): { lang: string; segments: Segment[] } {
  const langMatch = ssml.match(/xml:lang=["']([^"']+)["']/)
  const lang = langMatch ? langMatch[1] : ''
  const inner = ssml.replace(/<\/?speak[^>]*>/gi, '').replace(/<break[^>]*\/?>/gi, ' ')
  // 按 <mark name="N"/> 拆分，奇数项是 mark 名，偶数项是文本
  const parts = inner.split(/<mark\s+name="([^"]+)"\s*\/>/gi)
  const segments: Segment[] = []
  const pre = parts[0].replace(/<[^>]+>/g, '').trim()
  if (pre) segments.push({ mark: null, text: pre })
  for (let i = 1; i < parts.length; i += 2) {
    const text = (parts[i + 1] ?? '').replace(/<[^>]+>/g, '').trim()
    if (text) segments.push({ mark: parts[i], text })
  }
  return { lang, segments }
}

export default function useTTS() {
  const isReading = ref(false)
  const speedList = ref(['0.5', '0.75', '1', '1.25', '1.5', '1.75', '2'])
  const voiceIndex = ref(0)
  const voices = ref<SpeechSynthesisVoice[]>([])
  const speed = ref('1')
  const currentVoiceText = ref('')
  const currentLang = ref('')

  const currentVoice = computed(() => voices.value[voiceIndex.value])

  const { isSupported, isPlaying, status, speak, stop } = useSpeechSynthesis(currentVoiceText, {
    voice: currentVoice,
    rate: computed(() => Number(speed.value)),
    lang: currentLang,
  })

  onBeforeMount(() => {
    const load = () => {
      const v = window.speechSynthesis.getVoices()
      if (v.length) voices.value = v
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
  })

  // 分段队列（保留用于 setMark，不再逐词朗读）
  let segments: Segment[] = []

  /** 高亮当前 mark */
  const setMark = (mark: string | null) => {
    if (!mark || !rendition.value) return
    try {
      rendition.value.ttsSetMark?.(mark) ?? rendition.value.tts?.setMark?.(mark)
    } catch (e) {
      /* ignore */
    }
  }

  // 每句读完后推进到下一句
  watch(status, (s: string) => {
    if (s === 'end' && isReading.value) readNext()
  })

  /** 加载一段 SSML：高亮句首，整句一起朗读 */
  const loadSSML = (ssml: string) => {
    const { lang, segments: segs } = parseSSML(ssml)
    currentLang.value = lang
    segments = segs
    // 高亮句首位置
    setMark(segs[0]?.mark ?? null)
    // 把所有单词拼成完整句子朗读
    const fullText = segs.map((s) => s.text).join(' ')
    console.log('speak', fullText)
    currentVoiceText.value = fullText
    speak()
  }

  /** 当前页读完，获取下一段或翻页 */
  const readNext = async () => {
    const next = rendition.value.tts.next(true)
    if (next) {
      // 当前显示区域还有内容，继续朗读
      loadSSML(next)
    } else {
      // 当前显示区域已读完，翻到下一页
      await rendition.value.next()
      await rendition.value.initTTS()
      const first = rendition.value.tts.from(rendition.value.lastLocation?.range)
      if (first) loadSSML(first)
      else isReading.value = false
    }
  }

  watch(isReading, async (val: boolean) => {
    if (val) {
      if (!rendition.value || !isSupported.value) {
        isReading.value = false
        return
      }
      await rendition.value.initTTS()
      const ssml = rendition.value.tts.from(rendition.value.lastLocation.range)
      if (ssml) loadSSML(ssml)
    } else {
      stop()
      rendition.value?.initTTS(true)
    }
  })

  watch(rendition, (r: unknown) => {
    if (!r) {
      stop()
      isReading.value = false
    }
  })
  onUnmounted(() => {
    stop()
    rendition.value?.initTTS(true)
  })

  return { isReading, isPlaying, isSupported, voiceIndex, voices, speed, speedList }
}
