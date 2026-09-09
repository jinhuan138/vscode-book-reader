import { EdgeTTS } from 'node-edge-tts'
import { mkdirSync, rmSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { Store } from './store'

const TTS_CACHE_DIR = 'tts-cache'

const ttsByConfig = new Map<string, InstanceType<typeof EdgeTTS>>()

export type EdgeTTSResult = {
    filePath: string | null
    error?: string
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) return error.message
    if (typeof error === 'string') return error
    return 'Unknown Edge TTS error'
}

function speedToRate(speed: number): string {
    const n = Math.round((speed - 1) * 100)
    return n >= 0 ? `+${n}%` : `${n}%`
}

function getCacheDir(sessionId: string): string {
    const dir = join(Store.context!.globalStorageUri.fsPath, TTS_CACHE_DIR, sessionId)
    mkdirSync(dir, { recursive: true })
    return dir
}

function getTTS(voice: string, speed: number) {
    const rate = speedToRate(speed)
    const key = `${voice}:${rate}`
    let tts = ttsByConfig.get(key)
    if (!tts) {
        tts = new EdgeTTS({
            voice,
            lang: voice.split('-').slice(0, 2).join('-'),
            outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
            saveSubtitles: false,
            rate,
            timeout: 30000,
        })
        ttsByConfig.set(key, tts)
    }
    return tts
}

export async function generateEdgeTTS(
    sessionId: string,
    text: string,
    voice: string,
    speed: number,
): Promise<EdgeTTSResult> {
    const tts = getTTS(voice, speed)
    const filePath = join(getCacheDir(sessionId), `tts-${randomUUID()}.mp3`)
    try {
        await tts.ttsPromise(text, filePath)
        return { filePath }
    } catch (e) {
        console.error('[Edge TTS] 生成失败:', e)
        return { filePath: null, error: getErrorMessage(e) }
    }
}

export function clearTTSCache(sessionId: string): void {
    try { rmSync(join(Store.context!.globalStorageUri.fsPath, TTS_CACHE_DIR, sessionId), { recursive: true, force: true }) } catch { /* ignore */ }
}

/** Remove audio left behind by a previous extension-host session. */
export function clearAllTTSCache(): void {
    try { rmSync(join(Store.context!.globalStorageUri.fsPath, TTS_CACHE_DIR), { recursive: true, force: true }) } catch { /* ignore */ }
}
