import { reactive, watch, toRaw } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'
import { isSidebar } from './useSidebar'
import useVscode from './useVscode'

// ============ 工具函数 ============
const hexToRgba = (hex: string, opacity: number) => {
  if (hex.startsWith('rgba')) return hex
  const [r, g, b] = [hex.slice(1, 3), hex.slice(3, 5), hex.slice(5, 7)].map((x) => parseInt(x, 16))
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`
}

const parseRgba = (rgbaStr: string): { r: number; g: number; b: number; a: number } | null => {
  const match = rgbaStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
  return match
    ? {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] ? parseFloat(match[4]) : 1,
      }
    : null
}

const updateRgbaOpacity = (rgbaStr: string, opacity: number, decimals: number = 2): string => {
  const parsed = parseRgba(rgbaStr)
  if (!parsed) return rgbaStr

  const alpha = opacity / 100
  const roundedAlpha = Math.round(alpha * Math.pow(10, decimals)) / Math.pow(10, decimals)
  const finalAlpha = Number.isInteger(roundedAlpha) ? roundedAlpha : roundedAlpha.toFixed(decimals)

  return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${finalAlpha})`
}

// ============ 配置常量 ============
const vscode = useVscode()
const styles = getComputedStyle(document.documentElement)

const vscodeBackgroundColor = styles.getPropertyValue('--vscode-editor-background')
const vscodeTextColor = styles.getPropertyValue('--vscode-editor-foreground')

const defaultBackgroundColor = vscodeBackgroundColor ? hexToRgba(vscodeBackgroundColor, 100) : 'rgba(255,255,255,1)'
const defaultTextColor = vscodeTextColor ? hexToRgba(vscodeTextColor, 100) : 'rgba(0,0,0,1)'

const backgroundList = [defaultBackgroundColor, 'rgba(44,47,49,1)', 'rgba(233, 216, 188,1)', 'rgba(197, 231, 207,1)']
const textList = [defaultTextColor, 'rgba(255,255,255,1)', 'rgba(89, 68, 41,1)', 'rgba(54, 80, 62,1)']
const fontFamilyList = [
  { label: 'default', value: 'invalid-hack' },
  { label: 'Arial', value: "'Arial', Arimo, Liberation Sans, sans-serif" },
  { label: 'Lato', value: "'Lato', sans-serif" },
  { label: 'Georgia', value: "'Georgia', Liberation Serif, serif" },
  { label: 'Times New Roman', value: "Times New Roman', Tinos, Liberation Serif, Times, serif" },
  { label: 'Arbutus Slab', value: "'Arbutus Slab', serif" },
]
const textAlignList = ['left', 'center', 'right', 'justify']

// ============ 默认主题 ============
const defaultTheme = {
  fontSize: 100,
  fontFamily: 'invalid-hack',
  lineHeight: 1.5,
  textColor: '',
  backgroundColor: '',
  writingMode: 'horizontal-tb',
  textAlign: '',
  opacity: 100,
}

const theme = reactive(localStorage.getItem('theme') ? JSON.parse(localStorage.getItem('theme')!) : defaultTheme)

// ============ CSS 生成函数 ============
const commonTags =
  'section, aside, blockquote, article, nav, header, footer, main, figure,div, p, font, h1, h2, h3, h4, h5, h6, li, span'
const getCSS = ({ fontFamily, fontSize, textColor, backgroundColor, writingMode, textAlign, lineHeight }) => `
  html {
    --theme-text-color: ${textColor};
    --theme-bg-color: ${backgroundColor};
    --theme-font-family: ${fontFamily};
    --theme-font-size: ${fontSize}%;
    --theme-writing-mode: ${writingMode || ''};
    --theme-text-align: ${textAlign};
    --theme-line-height: ${lineHeight};
  }
  html,body{
    ${textColor ? 'color: var(--theme-text-color, transparent) !important;' : ''}
    ${backgroundColor ? 'background: var(--theme-bg-color, transparent) !important;' : ''}
  }
  ${commonTags} {
    ${textColor ? 'color: var(--theme-text-color, transparent) !important;' : ''}
    ${backgroundColor ? 'background: var(--theme-bg-color, transparent) !important;' : ''}
    ${fontFamily ? 'font-family: var(--theme-font-family) !important;' : ''}
    ${fontSize ? 'font-size: var(--theme-font-size) !important;' : ''}
    ${writingMode ? 'writing-mode: var(--theme-writing-mode) !important;' : ''}
    ${lineHeight ? 'line-height: var(--theme-line-height) !important;' : ''}
    ${textAlign ? 'text-align: var(--theme-text-align) !important;' : ''}
  }
  svg, img {
    background-color: transparent !important;
    mix-blend-mode: multiply;
  }
`

const getRule = ({ fontFamily, fontSize, textColor, backgroundColor, writingMode, textAlign, lineHeight }) => {
  const rule: { [key: string]: any } = {
    html: {
      '--theme-text-color': textColor,
      '--theme-bg-color': backgroundColor,
      '--theme-font-family': fontFamily,
      '--theme-font-size': `${fontSize}%`,
      '--theme-writing-mode': writingMode || '',
      '--theme-text-align': textAlign,
      '--theme-line-height': lineHeight,
    },
  }
  // 条件添加 html,body 样式
  const htmlBodyRule: { [key: string]: any } = {}
  if (textColor) {
    htmlBodyRule.color = 'var(--theme-text-color, transparent) !important'
  }
  if (backgroundColor) {
    htmlBodyRule['background-color'] = 'var(--theme-bg-color, transparent) !important'
  }
  rule['body'] = htmlBodyRule
  rule['html'] = { ...rule['html'], ...htmlBodyRule }

  //条件添加常见标签样式
  const commonTagsRule: { [key: string]: any } = htmlBodyRule
  if(fontSize){
    commonTagsRule['font-size'] = `var(--theme-font-size) !important`
  }
  if (fontFamily) {
    commonTagsRule['font-family'] = `var(--theme-font-family) !important`
  }
  if (writingMode) {
    commonTagsRule['writing-mode'] = `var(--theme-writing-mode) !important`
  }
  if (lineHeight) {
    commonTagsRule['line-height'] = `var(--theme-line-height) !important`
  }
  if(textAlign){
    commonTagsRule['text-align'] = `var(--theme-text-align) !important`
  }
  
  commonTags.split(',').forEach((tag) => {
    rule[tag] = commonTagsRule
  }) 
  return rule
}

// ============ 主题更新函数 ============
const updatedTheme = (newTheme: any) => {
  if (!rendition.value) return

  if (isEpub()) {
    rendition.value.getContents().forEach((content) => {
      content.addStylesheetRules(getRule(newTheme))
    })
  } else {
    rendition.value.renderer?.setStyles?.(getCSS(newTheme))
  }

  if (!isSidebar.value && vscode) {
    vscode.postMessage({
      type: 'style',
      content: JSON.stringify(newTheme),
    })
  }
}

// ============ 监听器 ============
watch(theme, (val) => {
  updatedTheme(val)
  localStorage.setItem('theme', JSON.stringify(val))
})

// ============ 导出函数 ============
export default function useTheme() {
  const restore = () => {
    Object.keys(defaultTheme).forEach((key) => {
      theme[key] = defaultTheme[key]
    })
  }

  const updateThemeOpacity = (opacity: number) => {
    theme.textColor = updateRgbaOpacity(theme.textColor, opacity, 3)
  }

  watch(() => theme.opacity, updateThemeOpacity)

  onReady(() => {
    const rawTheme = toRaw(theme)
    if (isEpub()) {
      rendition.value.hooks.content.register(() => updatedTheme(rawTheme))
      rendition.value.on('relocated', () => {
        rendition.value.hooks.content.register(() => updatedTheme(rawTheme))
      })
    } else {
      rendition.value.renderer?.setStyles?.(getCSS(rawTheme))
      rendition.value.addEventListener('load', () => {
        rendition.value.renderer?.setStyles?.(getCSS(rawTheme))
      })
    }
  })

  return { theme, restore, textList, backgroundList, fontFamilyList, textAlignList }
}
