import { ref, computed, watch, onUnmounted } from 'vue'
import { useSpeechSynthesis, useLocalStorage } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { rendition } from './useRendition'
import { isSidebar } from './useSidebar'
import useVscode from './useVscode'
import { edgeVoiceOptions } from './edgeVoices'
import { parseSSML, type Segment } from './splitSentence'

const engineList = [
  { label: 'Edge TTS', value: 'edge' },
  { label: 'System', value: 'system' },
]

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
  const ctx = new window.AudioContext()
  let schedEnd = 0

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
    vscode?.postMessage({
      type: 'ttsSpeak',
      content: { id, text, voice: ttsConfig.value.edgeVoice, speed: ttsConfig.value.speed },
    })
  }

  const playUrl = async (url: string, id: string) => {
    if (!url || !isReading.value || curId !== id) {
      return
    }
    try {
      if ((ctx as any).state === 'suspended') {
        await (ctx as any).resume()
      }
      const resp = await fetch(url)
      if (!resp.ok || !isReading.value || curId !== id) {
        return
      }
      const buf = await (ctx as any).decodeAudioData(await resp.arrayBuffer())
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
    if (!segs.length) {
      nextBlock()
      return
    }
    if (ttsConfig.value.engine === 'edge') speakEdge(0)
    else {
      setMarks(segs[0].marks)
      currentLang.value = blockLang || 'zh-CN'
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
      const w = urlWait.get(data.id)
      if (w) {
        urlWait.delete(data.id)
        w(data.content)
      } else urlCache.set(data.id, data.content)
    } else if (data?.type === 'ttsEnd' && data.id != null) {
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

