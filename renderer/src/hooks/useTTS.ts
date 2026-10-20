import { ref, computed, watch, onUnmounted } from 'vue'
import { useSpeechSynthesis, useLocalStorage } from '@vueuse/core'
import { ElMessage } from 'element-plus'
import 'element-plus/es/components/message/style/css'
import { rendition } from './useRendition'
import { isSidebar } from './useSidebar'
import useVscode, { saveConfig } from './useVscode'
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
  type AudioResult = { url: string; error?: never } | { url?: never; error: unknown }
  let audioQueue: Promise<AudioResult>[] = []
  let nextAudioIndex = 0
  let requestController = new AbortController()
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

  // 真正播放 Edge 音频时才创建，后续复用。
  let ctx: AudioContext | null = null
  let schedEnd = 0
  let playbackRun = 0
  let playbackState: 'idle' | 'starting' | 'playing' | 'stopping' = 'idle'
  const activeSources = new Set<AudioBufferSourceNode>()

  const isCurrentRun = (run: number) =>
    isReading.value && playbackRun === run && playbackState !== 'stopping'

  const stopEdgePlayback = () => {
    schedEnd = 0
    for (const source of activeSources) {
      source.onended = null
      try {
        source.stop()
        source.disconnect()
      } catch {
        /* 已结束的音频节点无需处理 */
      }
    }
    activeSources.clear()
  }

  const clearEdge = () => {
    schedEnd = 0
    requestController.abort()
    requestController = new AbortController()
    audioQueue = []
    nextAudioIndex = 0
    vscode?.postMessage({ type: 'ttsStop' })
  }

  const failPlayback = (error: unknown, run: number) => {
    if (!isCurrentRun(run)) return
    console.error('[TTS] 朗读失败:', error)
    showTTSError(error instanceof Error ? error.message : String(error))
    isReading.value = false
  }

  const requestAudio = (text: string): Promise<AudioResult> => {
    const request = vscode
      ? vscode.invoke('ttsSpeak', {
          text,
          voice: ttsConfig.value.edgeVoice,
          speed: ttsConfig.value.speed,
        }, { signal: requestController.signal })
      : Promise.reject(new Error('Edge TTS requires the VS Code extension'))

    // 预取立即接住错误，轮到该句时再处理，避免提前失败丢失或未处理的 rejection。
    return request.then((url) => ({ url }), (error) => ({ error }))
  }

  const playUrl = async (url: string, run: number, signal: AbortSignal) => {
    if (signal.aborted || !isCurrentRun(run)) return
    try {
      if (!url) throw new Error('Speech generation returned no audio URL')
      const audio = ctx ??= new window.AudioContext()
      if (audio.state === 'suspended') await audio.resume()
      if (signal.aborted || !isCurrentRun(run)) return
      const resp = await fetch(url, { signal })
      if (!resp.ok) throw new Error(`Failed to load speech audio: ${resp.status}`)
      const buf = await audio.decodeAudioData(await resp.arrayBuffer())
      if (signal.aborted || !isCurrentRun(run)) return
      const src = audio.createBufferSource()
      src.buffer = buf
      src.connect(audio.destination)
      const t = Math.max(audio.currentTime + 0.02, schedEnd)
      schedEnd = t + buf.duration
      src.onended = () => {
        activeSources.delete(src)
        src.disconnect()
        if (!signal.aborted && isCurrentRun(run)) advance(run)
      }
      // 音频下载、解码完成并即将播放时才切换高亮，避免网络等待期间提前高亮。
      setMarks(segs[segIdx]?.marks ?? [])
      activeSources.add(src)
      src.start(t)
    } catch (e) {
      if (!signal.aborted) failPlayback(e, run)
    }
  }

  const playNextAudio = async (run: number) => {
    if (!isCurrentRun(run)) return
    const signal = requestController.signal
    // 队列包含当前句和后续最多三句，按原文顺序消费 Promise。
    while (audioQueue.length < BUFFER_SIZE && nextAudioIndex < segs.length) {
      audioQueue.push(requestAudio(segs[nextAudioIndex++].text))
    }
    const next = audioQueue.shift()
    if (!next) return
    const result = await next
    if (signal.aborted || !isCurrentRun(run)) return
    if ('error' in result) failPlayback(result.error, run)
    else await playUrl(result.url, run, signal)
  }

  const speakEdge = (index: number, run: number) => {
    nextAudioIndex = index
    void playNextAudio(run)
  }

  const advance = (run: number) => {
    if (!isCurrentRun(run)) return
    segIdx++
    if (segIdx < segs.length) {
      void playNextAudio(run)
    } else {
      nextBlock(run)
    }
  }

  const advanceSys = (run: number) => {
    if (!isCurrentRun(run)) return
    segIdx++
    if (segIdx < segs.length) {
      setMarks(segs[segIdx].marks)
      currentVoiceText.value = segs[segIdx].text
      speakSys()
    } else nextBlock(run)
  }

  const loadBlock = (ssml: string, run: number) => {
    if (!isCurrentRun(run)) return
    clearEdge()
    stopSys()
    const { lang, segments } = parseSSML(ssml)
    blockLang = lang
    segs = segments.filter((s) => s.text)
    segIdx = 0
    if (!segs.length) {
      nextBlock(run)
      return
    }
    playbackState = 'playing'
    if (ttsConfig.value.engine === 'edge') speakEdge(0, run)
    else {
      setMarks(segs[0].marks)
      currentLang.value = blockLang || 'zh-CN'
      currentVoiceText.value = segs[0].text
      speakSys()
    }
  }

  const nextBlock = async (run: number) => {
    const current = rendition.value
    if (!current || !isCurrentRun(run)) return
    try {
      const n = current.tts?.next?.()
      if (n) {
        loadBlock(n, run)
        return
      }
      await current.next()
      if (!isCurrentRun(run) || rendition.value !== current) return
      current.tts = null
      await current.initTTS('word', highlightTTSRange)
      if (!isCurrentRun(run) || rendition.value !== current) return
      const first = current.tts?.from?.(current.lastLocation?.range)
      if (first) loadBlock(first, run)
      else isReading.value = false
    } catch (error) {
      failPlayback(error, run)
    }
  }

  const stopAll = () => {
    playbackRun++
    playbackState = 'stopping'
    try {
      const contents = (rendition.value as any)?.renderer?.getContents?.()
      if (contents) for (const { doc } of contents) doc.defaultView?.getSelection()?.removeAllRanges()
    } catch {
      /* ignore */
    }
    stopEdgePlayback()
    clearEdge()
    stopSys()
    if (rendition.value?.tts) rendition.value.tts = null
    playbackState = 'idle'
  }

  watch(isReading, async (val: boolean) => {
    if (val) {
      const run = ++playbackRun
      stopEdgePlayback()
      clearEdge()
      stopSys()
      playbackState = 'starting'
      if (!rendition.value) {
        isReading.value = false
        return
      }
      if (ttsConfig.value.engine === 'system' && !sysSupported.value) {
        isReading.value = false
        return
      }
      const current = rendition.value
      try {
        current.tts = null
        await current.initTTS('word', highlightTTSRange)
        if (!isCurrentRun(run) || rendition.value !== current) return
        const ssml = current.tts?.from?.(current.lastLocation?.range)
        if (ssml) loadBlock(ssml, run)
        else isReading.value = false
      } catch (error) {
        failPlayback(error, run)
      }
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
    if (
      (status === 'end' || status === 'error') &&
      ttsConfig.value.engine === 'system' &&
      playbackState === 'playing'
    ) {
      advanceSys(playbackRun)
    }
  })

  const restartCurrent = () => {
    if (!segs.length) return
    const run = ++playbackRun
    playbackState = 'starting'
    stopEdgePlayback()
    clearEdge()
    stopSys()
    if (ttsConfig.value.engine === 'edge') {
      playbackState = 'playing'
      speakEdge(segIdx, run) // 用新 edgeVoice/speed 重新合成当前句
    } else {
      setMarks(segs[segIdx].marks)
      currentLang.value = blockLang || 'zh-CN'
      currentVoiceText.value = segs[segIdx].text
      playbackState = 'playing'
      speakSys() // 系统 TTS 用新 rate/voice 重读当前句
    }
  }

  watch(
    ttsConfig,
    (config: Object) => {
      if (!isSidebar.value) {
        void saveConfig('ttsConfig', JSON.stringify(config))
      }
      // 包括侧边栏接收同步配置的情况。
      if (isReading.value && segs.length) restartCurrent()
    },
    { deep: true },
  )

  onUnmounted(() => {
    stopAll()
    ctx?.close().catch(() => { })
    window.speechSynthesis?.removeEventListener('voiceschanged', loadVoices)
  })

  return {
    isReading,
    ttsConfig,
    engineList,
    edgeVoiceOptions,
    systemVoiceList,
  }
}

