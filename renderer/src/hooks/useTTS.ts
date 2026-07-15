import { ref, computed, watch, onUnmounted } from 'vue'
import { AudioContext } from 'standardized-audio-context'
import { useSpeechSynthesis, useLocalStorage } from '@vueuse/core'
import { rendition } from './useRendition'
import { isSidebar } from './useSidebar'
import useVscode from './useVscode'
import { edgeVoiceOptions } from './edgeVoices'

type Segment = { mark: string | null; text: string }

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

// 按句末标点切分（参考 ReadAny splitIntoChunks，补充英文句号）
function splitBySentence(text: string): string[] {
  const cleaned = cleanText(text).replace(/\n/g, ' ') // 换行转空格，不作为切分点
  if (!cleaned) return []

  // 第一级：句末标点（。！？.!?；;）
  const bySentence = cleaned
    .split(/(?<=[。！？.!?；;])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
  if (bySentence.length > 1) return bySentence

  // 第二级：逗号（，,）
  const byComma = cleaned
    .split(/(?<=[，,])\s*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 1)
  if (byComma.length > 1) return byComma

  // 第三级：超过 80 字强制按字数截断
  if (cleaned.length > 80) {
    const chunks: string[] = []
    for (let i = 0; i < cleaned.length; i += 80) chunks.push(cleaned.slice(i, i + 80).trim())
    return chunks.filter(Boolean)
  }

  return [cleaned]
}

function parseSSML(ssml: string): { lang: string; segments: Segment[] } {
  const lang = ssml.match(/xml:lang=["']([^"']+)["']/)?.[1] ?? ''
  const inner = ssml.replace(/<\/?speak[^>]*>/gi, '').replace(/<break[^>]*\/?>/gi, ' ')
  const parts = inner.split(/<mark\s+name="([^"]+)"\s*\/>/gi)
  const segs: Segment[] = []

  // 收集原始 (mark, text) 对
  const raw: { mark: string | null; text: string }[] = []
  const pre = parts[0].replace(/<[^>]+>/g, '').trim()
  if (pre) raw.push({ mark: null, text: pre })
  for (let i = 1; i < parts.length; i += 2) {
    const t = (parts[i + 1] ?? '').replace(/<[^>]+>/g, '').trim()
    if (t) raw.push({ mark: parts[i], text: t })
  }

  // 合并残句：末尾非句末标点（允许句末标点后跟闭合引号/括号）则与下一段拼接
  const isSentenceEnd = (s: string) => /[。！？.!?；;]["'»\u201d\u2019\u300b\u300d)）\]】]*\s*$/.test(s)
  const merged: { mark: string | null; text: string }[] = []
  let acc: { mark: string | null; text: string } | null = null
  for (const pair of raw) {
    const t = cleanText(pair.text)
    if (!t) continue
    if (acc) {
      acc.text = acc.text + ' ' + t
    } else {
      acc = { mark: pair.mark, text: t }
    }
    if (isSentenceEnd(acc.text)) {
      merged.push(acc)
      acc = null
    }
  }
  if (acc) merged.push(acc)

  // 对每个合并后的块再按标点细分
  const addText = (mark: string | null, text: string) => {
    const subs = splitBySentence(text)
    if (!subs.length) return
    segs.push({ mark, text: subs[0] })
    for (let j = 1; j < subs.length; j++) segs.push({ mark: null, text: subs[j] })
  }
  for (const { mark, text } of merged) addText(mark, text)

  return { lang, segments: segs }
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

  const setMark = (mark: string | null) => {
    if (!rendition.value?.tts) return
    try {
      rendition.value.tts.setMark?.(mark)
    } catch {
      /* ignore */
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
    setMark(segs[i].mark)
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
      setMark(segs[segIdx].mark)
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
      setMark(segs[segIdx].mark)
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
      setMark(segs[0].mark)
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
    await rendition.value.initTTS('sentence')
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
      await rendition.value.initTTS('sentence')
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
      setMark(segs[segIdx].mark)
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
    ctx.close().catch(() => {})
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
