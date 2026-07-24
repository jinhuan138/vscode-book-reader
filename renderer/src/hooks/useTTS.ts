import { ref, computed, watch, onUnmounted } from 'vue'
import { AudioContext } from 'standardized-audio-context'
import { useSpeechSynthesis, useLocalStorage } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { rendition } from './useRendition'
import { isSidebar } from './useSidebar'
import useVscode from './useVscode'
import { edgeVoiceOptions } from './edgeVoices'

type Segment = { marks: string[]; text: string }

const engineList = [
  { label: 'Edge TTS', value: 'edge' },
  { label: 'System', value: 'system' },
]

// 移除脚注标记（参考 ReadAny cleanText）
function cleanText(text: string): string {
  return text
    .replace(
      /(?:\s*(?:\[(?:\d{1,4}|[\u4e00-\u9fff]{1,8}|[ivxlcdmIVXLCDM]{1,10})\]|【(?:\d{1,4}|[\u4e00-\u9fff]{1,8})】|（(?:\d{1,4}|[\u4e00-\u9fff]{1,8})）))+/gu,
      '',
    )
    .replace(/\s+/g, ' ')
    .trim()
}

type TextSlice = { start: number; end: number }

function getUnitEnds(text: string, lang: string, isCJK: boolean): number[] {
  const unitEnds: number[] = []
  if (isCJK) {
    for (let i = 0; i < text.length; i++) {
      if (!/\s/u.test(text[i])) unitEnds.push(i + 1)
    }
    return unitEnds
  }

  let words: Intl.Segments
  try {
    words = new Intl.Segmenter(lang || undefined, { granularity: 'word' }).segment(text)
  } catch {
    words = new Intl.Segmenter(undefined, { granularity: 'word' }).segment(text)
  }
  for (const word of words) {
    if (word.isWordLike) unitEnds.push(word.index + word.segment.length)
  }
  return unitEnds
}

function findClauseBoundary(text: string, start: number, min: number, target: number, max: number): number {
  let cut = 0
  let bestScore = -Infinity
  const punctuation = /[;；:：,，]/gu
  punctuation.lastIndex = start
  for (let match = punctuation.exec(text); match && match.index < max; match = punctuation.exec(text)) {
    const end = match.index + match[0].length
    if (end < min) continue
    const priority = /[;；:：]/u.test(match[0]) ? 2 : 1
    const score = priority * 1000 - Math.abs(end - target)
    if (score > bestScore) {
      bestScore = score
      cut = end
    }
  }
  if (!cut) cut = max
  while (cut < text.length && /[\s.!?。！？'\u0022’”）)\]]/u.test(text[cut])) cut++
  return cut
}

function splitLongSentence(text: string, lang: string): TextSlice[] {
  const cjkChars = text.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/gu)?.length ?? 0
  const isCJK = cjkChars > text.length * 0.2
  const target = isCJK ? 32 : 20
  const max = isCJK ? 45 : 30
  const min = isCJK ? 12 : 8
  const unitEnds = getUnitEnds(text, lang, isCJK)
  if (unitEnds.length <= max) return [{ start: 0, end: text.length }]

  const slices: TextSlice[] = []
  let start = 0
  let unitStart = 0
  while (unitStart < unitEnds.length) {
    const remaining = unitEnds.length - unitStart
    if (remaining <= max) {
      slices.push({ start, end: text.length })
      break
    }
    const minPos = unitEnds[unitStart + min - 1]
    const targetPos = unitEnds[unitStart + target - 1]
    const maxPos = unitEnds[unitStart + max - 1]
    const cut = findClauseBoundary(text, start, minPos, targetPos, maxPos)
    slices.push({ start, end: cut })
    start = cut
    while (start < text.length && /\s/u.test(text[start])) start++
    unitStart = unitEnds.findIndex((end) => end > start)
    if (unitStart < 0) break
  }
  return slices
}

function parseSSML(ssml: string): { lang: string; segments: Segment[] } {
  const lang = ssml.match(/xml:lang=["']([^"']+)["']/)?.[1] ?? ''
  const inner = ssml.replace(/<\/?speak[^>]*>/gi, '').replace(/<break[^>]*\/?>/gi, ' ')
  const parts = inner.split(/<mark\s+name="([^"]+)"\s*\/>/gi)
  const chunks: Array<{ mark: string | null; text: string }> = []

  const getText = (text: string) => text.replace(/<[^>]+>/g, '')
  const pre = getText(parts[0])
  chunks.push({ mark: null, text: pre })
  for (let i = 1; i < parts.length; i += 2) {
    chunks.push({ mark: parts[i], text: getText(parts[i + 1] ?? '') })
  }

  let fullText = ''
  const spans: Array<{ start: number; end: number; mark: string | null }> = []
  for (const chunk of chunks) {
    const text = cleanText(chunk.text)
    if (!text) continue
    const cjkBoundary = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]$/u.test(fullText) ||
      /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(text)
    const tightBoundary = /[(\[{‘“]$/u.test(fullText) || /^[,.;:!?，。！？；：)\]}’”]/u.test(text)
    if (fullText && !cjkBoundary && !tightBoundary) fullText += ' '
    const start = fullText.length
    fullText += text
    spans.push({ start, end: fullText.length, mark: chunk.mark })
  }

  const segments: Segment[] = []

  let sentenceSegments: Intl.Segments
  try {
    sentenceSegments = new Intl.Segmenter(lang || undefined, { granularity: 'sentence' }).segment(fullText)
  } catch {
    sentenceSegments = new Intl.Segmenter(undefined, { granularity: 'sentence' }).segment(fullText)
  }
  for (const { index, segment } of sentenceSegments) {
    for (const slice of splitLongSentence(segment, lang)) {
      const text = cleanText(segment.slice(slice.start, slice.end))
      if (!text) continue
      const start = index + slice.start
      const end = index + slice.end
      const marks = spans
        .filter((span) => span.mark != null && span.end > start && span.start < end)
        .map((span) => span.mark!)
      segments.push({ marks: [...new Set(marks)], text })
    }
  }

  return { lang, segments }
}

export default function useTTS() {
  const vscode = useVscode()
  const isReading = ref(false)
  const ttsConfig = useLocalStorage('ttsConfig', {
    speed: 1,
    engine: 'system',
    edgeVoice: 'zh-CN-XiaoxiaoNeural',
    systemVoice: 0,
  })

  // 系统 TTS（@vueuse/core）
  const currentVoiceText = ref('')
  const currentLang = ref('zh-CN')
  const systemVoiceList = ref<SpeechSynthesisVoice[]>([])
  const loadVoices = () => {
    const v = window.speechSynthesis?.getVoices()
    if (v?.length) systemVoiceList.value = v
  }
  loadVoices()
  window.speechSynthesis?.addEventListener('voiceschanged', loadVoices)
  const {
    isSupported: sysSupported,
    speak: speakSys,
    stop: stopSys,
    status: sysStatus,
  } = useSpeechSynthesis(currentVoiceText, {
    voice: computed(() => systemVoiceList.value[ttsConfig.value.systemVoice] ?? undefined),
    rate: computed(() => ttsConfig.value.speed),
    lang: currentLang,
  })

  // 段落状态
  let segs: Segment[] = []
  let segIdx = 0
  let blockLang = ''

  let collectingHighlightRanges: Range[] | null = null

  const highlightTTSRange = (range: Range) => {
    if (collectingHighlightRanges) {
      collectingHighlightRanges.push(range.cloneRange())
      return
    }
    rendition.value?.renderer.scrollToAnchor(range, true)
  }

  const setMarks = (marks: string[]) => {
    if (!rendition.value?.tts) return
    const ranges: Range[] = []
    collectingHighlightRanges = ranges
    try {
      for (const mark of marks) rendition.value.tts.setMark?.(mark)
    } catch {
      /* ignore */
    } finally {
      collectingHighlightRanges = null
    }

    if (ranges.length) {
      const range = ranges[0].cloneRange()
      const last = ranges[ranges.length - 1]
      try {
        range.setEnd(last.endContainer, last.endOffset)
      } catch {
        /* 异常时至少保留首段高亮 */
      }
      rendition.value.renderer.scrollToAnchor(range, true)
    }
  }

  // Edge TTS 请求管理
  const BUFFER_SIZE = 4
  let rid = 0
  const nid = () => String(++rid)
  let curId: string | null = null
  let preIds: string[] = [] // 预取队列，最多 BUFFER_SIZE-1 个
  const urlCache = new Map<string, string>()
  const urlWait = new Map<string, (u: string) => void>()
  const TTS_ERROR_NOTICE_INTERVAL = 60 * 1000
  let lastTTSErrorNoticeAt = 0

  const showTTSError = (error?: string) => {
    const now = Date.now()
    if (now - lastTTSErrorNoticeAt < TTS_ERROR_NOTICE_INTERVAL) return
    lastTTSErrorNoticeAt = now

    const isProxyError = /proxy|proxies|pacproxy|127\.0\.0\.1:7897|socket connection/i.test(error ?? '')
    ElMessage.warning(
      isProxyError
        ? '\u8bed\u97f3\u751f\u6210\u5931\u8d25\uff1a\u65e0\u6cd5\u8fde\u63a5\u4ee3\u7406 127.0.0.1:7897\uff0c\u8bf7\u5f00\u542f VPN/\u4ee3\u7406\u6216\u5173\u95ed VS Code \u4ee3\u7406\u8bbe\u7f6e\u540e\u91cd\u8bd5\u3002'
        : '\u8bed\u97f3\u751f\u6210\u5931\u8d25\uff0c\u8bf7\u68c0\u67e5\u7f51\u7edc\u6216\u7a0d\u540e\u91cd\u8bd5\u3002',
    )
  }

  // AudioContext 创建一次，整个生命周期复用
  const ctx = new AudioContext()
  let schedEnd = 0
  console.log('[TTS] AudioContext创建 state=', (ctx as any).state)

  const clearEdge = () => {
    schedEnd = 0
    curId = null
    preIds = []
    urlCache.clear()
    urlWait.forEach((r) => r(''))
    urlWait.clear()
  }

  const getUrl = (id: string) => {
    const c = urlCache.get(id)
    if (c !== undefined) {
      urlCache.delete(id)
      return Promise.resolve(c)
    }
    return new Promise<string>((r) => urlWait.set(id, r))
  }

  const reqAudio = (id: string, text: string) => {
    console.log('[TTS] 发送请求', id, text.slice(0, 20))
    vscode?.postMessage({
      type: 'ttsSpeak',
      content: { id, text, voice: ttsConfig.value.edgeVoice, speed: ttsConfig.value.speed },
    })
  }

  const playUrl = async (url: string, id: string) => {
    console.log('[TTS] 开始播放', id, 'url:', url ? url.slice(0, 60) : '(空)')
    if (!url || !isReading.value || curId !== id) {
      return
    }
    try {
      if ((ctx as any).state === 'suspended') {
        await (ctx as any).resume()
        console.log('[TTS] AudioContext resume后 state=', (ctx as any).state)
      }
      console.log('[TTS] 开始 fetch', id)
      const resp = await fetch(url)
      console.log('[TTS] fetch响应', resp.status, resp.ok)
      if (!resp.ok || !isReading.value || curId !== id) {
        console.log('[TTS] fetch中止 响应ok?', resp.ok, '朗读中?', isReading.value, 'id匹配?', curId === id)
        return
      }
      const buf = await (ctx as any).decodeAudioData(await resp.arrayBuffer())
      console.log('[TTS] 解码完成 时长=', buf.duration)
      if (!isReading.value || curId !== id) return
      const src = (ctx as any).createBufferSource()
      src.buffer = buf
      src.connect((ctx as any).destination)
      const t = Math.max((ctx as any).currentTime + 0.02, schedEnd)
      schedEnd = t + buf.duration
      src.onended = () => {
        if (isReading.value && curId === id) advance()
      }
      // 音频下载、解码完成并即将播放时才切换高亮，避免网络等待期间提前高亮。
      setMarks(segs[segIdx]?.marks ?? [])
      src.start(t)
      console.log('[TTS] 已调度播放 id=', id, '延迟=', (t - (ctx as any).currentTime).toFixed(3), 's')
    } catch (e) {
      console.error('[TTS] 播放异常:', e)
      if (isReading.value && curId === id) advance()
    }
  }

  const speakEdge = (i: number) => {
    const id = nid()
    curId = id
    reqAudio(id, segs[i].text)
    // 预取后续最多 BUFFER_SIZE-1 句
    preIds = []
    for (let p = 1; p < BUFFER_SIZE && i + p < segs.length; p++) {
      const pid = nid()
      preIds.push(pid)
      reqAudio(pid, segs[i + p].text)
    }
    getUrl(id).then((u) => playUrl(u, id))
  }

  const advance = () => {
    if (!isReading.value) return
    segIdx++
    if (segIdx < segs.length) {
      // 从预取队列取ID（已在飞请求），否则新建并立即请求
      let id: string
      if (preIds.length > 0) {
        id = preIds.shift()!
      } else {
        id = nid()
        reqAudio(id, segs[segIdx].text)
      }
      curId = id
      getUrl(id).then((u) => playUrl(u, id))
      // 队尾补1个新预取，维持 BUFFER_SIZE-1 深度
      const nextPrefetch = segIdx + preIds.length + 1
      if (nextPrefetch < segs.length) {
        const pid = nid()
        preIds.push(pid)
        reqAudio(pid, segs[nextPrefetch].text)
      }
    } else {
      nextBlock()
    }
  }

  const advanceSys = () => {
    if (!isReading.value) return
    segIdx++
    if (segIdx < segs.length) {
      setMarks(segs[segIdx].marks)
      currentVoiceText.value = segs[segIdx].text
      speakSys()
    } else nextBlock()
  }

  const loadBlock = (ssml: string) => {
    clearEdge()
    stopSys()
    const { lang, segments } = parseSSML(ssml)
    blockLang = lang
    segs = segments.filter((s) => s.text)
    segIdx = 0
    console.log('[TTS] loadBlock 共', segs.length, '句:', segs.map((s) => s.text).join('\n'))
    if (!segs.length) {
      nextBlock()
      return
    }
    if (ttsConfig.value.engine === 'edge') speakEdge(0)
    else {
      setMarks(segs[0].marks)
      currentLang.value = blockLang || 'zh-CN'
      console.log('[TTS] 语言', currentLang.value, 'blockLang=', blockLang)
      currentVoiceText.value = segs[0].text
      speakSys()
    }
  }

  const nextBlock = async () => {
    if (!rendition.value || !isReading.value) return
    const n = rendition.value.tts?.next?.()
    if (n) {
      loadBlock(n)
      return
    }
    await rendition.value.next()
    if (rendition.value.tts) rendition.value.tts = null
    await rendition.value.initTTS('word', highlightTTSRange)
    const first = rendition.value.tts?.from?.(rendition.value.lastLocation?.range)
    if (first) loadBlock(first)
    else isReading.value = false
  }

  const stopAll = () => {
    try {
      const contents = (rendition.value as any)?.renderer?.getContents?.()
      if (contents) for (const { doc } of contents) doc.defaultView?.getSelection()?.removeAllRanges()
    } catch {
      /* ignore */
    }
    clearEdge()
    stopSys()
    vscode?.postMessage({ type: 'ttsStop' })
    if (rendition.value?.tts) rendition.value.tts = null
  }

  const handleMsg = ({ data }: MessageEvent) => {
    if (!isReading.value || ttsConfig.value.engine !== 'edge') return
    if (data?.type === 'ttsAudio' && data.id != null) {
      console.log('[TTS] 收到音频 id=', data.id, 'url=', String(data.content).slice(0, 60))
      const w = urlWait.get(data.id)
      if (w) {
        urlWait.delete(data.id)
        w(data.content)
      } else urlCache.set(data.id, data.content)
    } else if (data?.type === 'ttsEnd' && data.id != null) {
      console.log('[TTS] 生成失败 id=', data.id)
      const w = urlWait.get(data.id)
      if (w) {
        urlWait.delete(data.id)
        w('')
      }
    }
  }
  window.addEventListener('message', handleMsg)

  watch(isReading, async (val: boolean) => {
    if (val) {
      if (!rendition.value) {
        isReading.value = false
        return
      }
      if (ttsConfig.value.engine === 'system' && !sysSupported.value) {
        isReading.value = false
        return
      }
      if (rendition.value.tts) rendition.value.tts = null
      await rendition.value.initTTS('word', highlightTTSRange)
      const ssml = rendition.value.tts?.from?.(rendition.value.lastLocation?.range)
      console.log('[TTS] 开始朗读 引擎=', ttsConfig.value.engine, 'ssml=', ssml ? ssml.slice(0, 80) : '(null)')
      if (ssml) loadBlock(ssml)
    } else {
      stopAll()
    }
  })

  watch(rendition, (r: unknown) => {
    if (!r) {
      stopAll()
      isReading.value = false
    }
  })

  watch(sysStatus, (status: string) => {
    if ((status === 'end' || status === 'error') && isReading.value && ttsConfig.value.engine === 'system') advanceSys()
  })

  const restartCurrent = () => {
    if (!segs.length) return
    clearEdge()
    stopSys()
    if (ttsConfig.value.engine === 'edge') {
      speakEdge(segIdx) // 用新 edgeVoice/speed 重新合成当前句
    } else {
      setMarks(segs[segIdx].marks)
      currentLang.value = blockLang || 'zh-CN'
      currentVoiceText.value = segs[segIdx].text
      speakSys() // 系统 TTS 用新 rate/voice 重读当前句
    }
  }

  watch(
    ttsConfig,
    (config: Object) => {
      if (!isSidebar.value && vscode) {
        vscode.postMessage({
          type: 'ttsConfig',
          content: JSON.stringify(config),
        })
        // 朗读中配置变化 → 用新配置重新生成当前句并继续播放
        if (isReading.value && segs.length) {
          restartCurrent()
        }
      }
    },
    { deep: true },
  )

  onUnmounted(() => {
    stopAll()
    ctx.close().catch(() => { })
    window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
    window.removeEventListener('message', handleMsg)
  })

  return {
    isReading,
    ttsConfig,
    engineList,
    edgeVoiceOptions,
    systemVoiceList,
  }
}

