import { ref, watch, onBeforeMount } from 'vue'
import useRendition from './useRendition'

const [rendition] = useRendition()
let isAudioOn = false
let text = ''

const setSpeech: Promise<any[]> = () => {
  return new Promise((resolve, reject) => {
    let synth = window.speechSynthesis
    let id

    id = setInterval(() => {
      if (synth.getVoices().length !== 0) {
        resolve(synth.getVoices())
        clearInterval(id)
      } else {
        // this.setState({ isSupported: false })
      }
    }, 10)
  })
}

export default function useSpeak() {
  const isReading = ref(false)
  const speed = ref(1)
  const speedList = ref([
    '0.1',
    '0.2',
    '0.3',
    '0.4',
    '0.5',
    '0.75',
    '1',
    '1.25',
    '1.5',
    '1.75',
    '2',
    '3',
    '4',
    '5',
  ])
  const voiceIndex = ref(0)
  const voices = ref<any[]>([])
  onBeforeMount(async () => {
    voices.value = await setSpeech()
  })
  const speak = (flag = false) => {
    if (flag) {
      voice(text, speed.value)
    } else {
      isAudioOn = false
      window.speechSynthesis.cancel()
    }
  }
  const voice = (text, rate = 1) => {
    isAudioOn = true
    const msg = new SpeechSynthesisUtterance()
    msg.text = text
    msg.voice = window.speechSynthesis.getVoices()[0]
    msg.rate = rate
    window.speechSynthesis.speak(msg)
    msg.onerror = (err) => {
      console.log(err)
    }
    msg.onend = async (event) => {
      if (!isReading.value && !isAudioOn) return
      if (!rendition.value.shadowRoot) {
        rendition.value.next()
      } else {
        rendition.value.renderer.next()
      }
    }
  }
  watch(rendition, (instance) => {
    if (!instance.shadowRoot) {
      instance.on('locationChanged', () => {
        const range = instance.getRange(instance.currentLocation().start.cfi)
        const endRange = instance.getRange(instance.currentLocation().end.cfi)
        range.setEnd(endRange.startContainer, endRange.startOffset)
        text = range
          .toString()
          .replace(/\s\s/g, '')
          .replace(/\r/g, '')
          .replace(/\n/g, '')
          .replace(/\t/g, '')
          .replace(/\f/g, '')
        isReading.value && speak(true)
      })
    } else {
      instance.addEventListener('relocate', ({ detail }) => {
        const { range } = detail
        const innerText = range?.commonAncestorContainer?.innerText
        if (innerText) {
          text = innerText
            .toString()
            .replace(/\s\s/g, '')
            .replace(/\r/g, '')
            .replace(/\n/g, '')
            .replace(/\t/g, '')
            .replace(/\f/g, '')
          isReading.value && speak(true)
        }
      })
    }
  })
  watch(isReading, (flag) => {
    speak(flag)
  })
  return { isReading, voiceIndex, voices, speed, speedList }
}
