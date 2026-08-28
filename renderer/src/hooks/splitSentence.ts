export type Segment = { marks: string[]; text: string }

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

export function parseSSML(ssml: string): { lang: string; segments: Segment[] } {
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
