import { EdgeTTS } from 'node-edge-tts'
import { mkdirSync, rmdirSync, rmSync } from 'fs'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { Uri, type Webview } from 'vscode'
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
        try { rmSync(filePath, { force: true }) } catch { /* ignore partial files still in use */ }
        console.error('[Edge TTS] 生成失败:', e)
        return { filePath: null, error: getErrorMessage(e) }
    }
}

/** One cache and request lifecycle per webview, including repeated views of the same book. */
export function createTTSHandler(webview: Webview) {
    const sessionId = randomUUID()
    const requests = new Map<string, { cancelled: boolean; filePath?: string }>()
    const files = new Set<string>()
    let disposed = false

    const removeFile = (filePath: string) => {
        files.delete(filePath)
        try { rmSync(filePath, { force: true }) } catch { /* ignore */ }
    }
    const removeEmptyDirectory = () => {
        // Never recursively remove a directory while the synthesizer is writing to it.
        if (requests.size) return
        try { rmdirSync(join(Store.context!.globalStorageUri.fsPath, TTS_CACHE_DIR, sessionId)) } catch { /* not empty or absent */ }
    }
    const respond = async (id: string, result?: string, error?: { name: string; message: string }) => {
        if (disposed) return false
        try {
            return await webview.postMessage({ type: 'invokeResult', id, result, error })
        } catch {
            return false
        }
    }
    const stop = () => {
        for (const [id, request] of requests) {
            request.cancelled = true
            void respond(id, undefined, { name: 'AbortError', message: 'Speech cancelled' })
        }
        for (const filePath of files) removeFile(filePath)
        removeEmptyDirectory()
    }
    const synthesize = async (id: string, params: any) => {
        const request = { cancelled: false, filePath: undefined as string | undefined }
        requests.set(id, request)
        try {
            const { text, voice, speed = 1 } = params ?? {}
            if (typeof text !== 'string' || !text.trim() || typeof voice !== 'string' || !voice.trim() ||
                !Number.isFinite(speed) || speed <= 0) {
                throw new Error('Invalid speech parameters')
            }
            const { filePath, error } = await generateEdgeTTS(sessionId, text, voice, speed)
            if (!filePath) throw new Error(error || 'Speech generation failed')
            request.filePath = filePath
            if (request.cancelled || disposed) {
                removeFile(filePath)
                return
            }
            files.add(filePath)
            const delivered = await respond(id, webview.asWebviewUri(Uri.file(filePath)).toString())
            if (!delivered || request.cancelled || disposed) removeFile(filePath)
        } catch (error) {
            if (request.filePath) removeFile(request.filePath)
            if (!request.cancelled) {
                await respond(id, undefined, {
                    name: error instanceof Error ? error.name : 'Error',
                    message: getErrorMessage(error),
                })
            }
        } finally {
            requests.delete(id)
            removeEmptyDirectory()
        }
    }

    return {
        stop,
        handleMessage(message: any): boolean {
            if (message?.type === 'ttsStop') {
                stop()
                return true
            }
            if (message?.type === 'cancelInvoke') {
                const request = requests.get(message.id)
                if (!request) return false
                request.cancelled = true
                if (request.filePath) removeFile(request.filePath)
                return true
            }
            if (message?.type !== 'invoke' || typeof message.id !== 'string') return false
            if (message.method !== 'ttsSpeak') return false
            if (!disposed && !requests.has(message.id)) {
                void synthesize(message.id, message.params)
            }
            return true
        },
        dispose() {
            disposed = true
            stop()
        },
    }
}

/** Remove audio left behind by a previous extension-host session. */
export function clearAllTTSCache(): void {
    try { rmSync(join(Store.context!.globalStorageUri.fsPath, TTS_CACHE_DIR), { recursive: true, force: true }) } catch { /* ignore */ }
}
