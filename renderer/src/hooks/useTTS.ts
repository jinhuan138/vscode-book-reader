import { ref, onBeforeMount } from 'vue'
import { rendition, onReady } from './useRendition'

export default function useTTS() {
  const isInit = ref(false)
  const speaking = ref(false)
  const speed = ref(1)
  const speedList = ref(['0.1', '0.2', '0.3', '0.4', '0.5', '0.75', '1', '1.25', '1.5', '1.75', '2', '3', '4', '5'])
  const voiceIndex = ref(0)
  const voices = ref<any[]>([])
  let utterance = null as SpeechSynthesisUtterance | null
  let currentVoiceText = ''

  onBeforeMount(async () => {
    voices.value = await setSpeech()
  })
  onReady(() => {
    // rendition.value.addEventListener('relocate', onRelocate)
  })

  const prevSection = () => rendition.value.renderer.prevSection()

  const nextSection = () => rendition.value.renderer.nextSection()
  const initTts = () => rendition.value.initTTS()
  const ttsStop = () => rendition.value.initTTS(true)

  const ttsHere = () => {
    initTts()
    return rendition.value.tts.from(rendition.value.lastLocation.range)
  }
  const ttsNextSection = async () => {
    await nextSection()
    initTts()
    return ttsNext()
  }

  const ttsPrevSection = async (last: boolean) => {
    await prevSection()
    initTts()
    return last ? rendition.value.tts.end() : ttsNext()
  }
  const ttsNext = async (): Promise<any> => {
    const result = rendition.value.tts.next(true)
    if (result) return result
    return await ttsNextSection()
  }

  const ttsPrev = () => {
    const result = rendition.value.tts.prev(true)
    if (result) return result
    return ttsPrevSection(true)
  }

  const speakText = () => {
    speak()
  }

  const initUtterance = () => {
    utterance = new SpeechSynthesisUtterance(currentVoiceText)
    //  utterance.volume =
    utterance.rate = speed.value
    //  utterance.pitch =
    //  utterance.voice =
  }
  const speak = async (content?: string) => {
    currentVoiceText = content || ttsHere()
    initUtterance()
    window.speechSynthesis.speak(utterance as SpeechSynthesisUtterance)
    const nextText = await ttsNext()
    if (nextText) {
      currentVoiceText = nextText
      return speak(currentVoiceText)
    }
  }
  return { speaking, voiceIndex, voices, speed, speedList }
}
