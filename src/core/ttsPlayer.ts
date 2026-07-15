import { EdgeTTS } from 'node-edge-tts'
import { mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { Store } from './store'

const TTS_CACHE_DIR = 'tts-cache'

let tts: InstanceType<typeof EdgeTTS> | null = null
let curVoice = ''
let curRate = ''

function speedToRate(speed: number): string {
    const n = Math.round((speed - 1) * 100)
    return n >= 0 ? `+${n}%` : `${n}%`
}

function getCacheDir(): string {
    const dir = join(Store.context!.globalStorageUri.fsPath, TTS_CACHE_DIR)
    mkdirSync(dir, { recursive: true })
    return dir
}

function ensureTTS(voice: string, speed: number) {
    const rate = speedToRate(speed)
    if (tts && curVoice === voice && curRate === rate) return
    clearTTSCache()  // 语音或速度变了，清除旧缓存
    tts = new EdgeTTS({
        voice,
        lang: voice.split('-').slice(0, 2).join('-'),
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
        saveSubtitles: false,
        rate,
        timeout: 30000,
    })
    curVoice = voice
    curRate = rate
}

export async function generateEdgeTTS(
    id: string,
    text: string,
    voice: string,
    speed: number,
): Promise<string | null> {
    ensureTTS(voice, speed)
    const filePath = join(getCacheDir(), `tts-${id}.mp3`)
    try {
        await tts!.ttsPromise(text, filePath)
        return filePath
    } catch (e) {
        console.error('[Edge TTS] 生成失败:', e)
        return null
    }
}

export function clearTTSCache(): void {
    try { rmSync(join(Store.context!.globalStorageUri.fsPath, TTS_CACHE_DIR), { recursive: true, force: true }) } catch { /* ignore */ }
}
