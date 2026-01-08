import { reactive, watch, toRaw } from 'vue'
import { rendition, isEpub, onReady } from './useRendition'
import { isSidebar } from './useSidebar'
import useVscode from './useVscode'

const hexToRgba = (hex: string, opacity: number) => {
  if (hex.startsWith('rgba')) {
    return hex
  }
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const alpha = opacity / 100
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
const element = document.documentElement // 或其他元素
const styles = getComputedStyle(element)

const vscodeBackgroundColor = styles.getPropertyValue('--vscode-editor-background')
const defaultBackgroundColor = vscodeBackgroundColor ? hexToRgba(vscodeBackgroundColor, 100) : 'rgba(255,255,255,1)'
const backgroundList = [defaultBackgroundColor, 'rgba(44,47,49,1)', 'rgba(233, 216, 188,1)', 'rgba(197, 231, 207,1)']

const vscodeTextColor = styles.getPropertyValue('--vscode-editor-foreground')
const defaultTextColor = vscodeTextColor ? hexToRgba(vscodeTextColor, 100) : 'rgba(0,0,0,1)'
const textList = [defaultTextColor, 'rgba(255,255,255,1)', 'rgba(89, 68, 41,1)', 'rgba(54, 80, 62,1)']
const fontFamilyList = [
  {
    label: 'default',
    value: 'invalid-hack',
  },
  {
    label: 'Arial',
    value: "'Arial', Arimo, Liberation Sans, sans-serif",
  },
  {
    label: 'Lato',
    value: "'Lato', sans-serif",
  },
  {
    label: 'Georgia',
    value: "'Georgia', Liberation Serif, serif",
  },
  {
    label: 'Times New Roman',
    value: "Times New Roman', Tinos, Liberation Serif, Times, serif",
  },
  {
    label: 'Arbutus Slab',
    value: "'Arbutus Slab', serif",
  },
]
const textAlignList = ['left', 'center', 'right', 'justify']
const vscode = useVscode()

const defaultTheme = {
  fontSize: 100,
  fontFamily: 'invalid-hack',
  lineHeight: 1.5,
  textColor: defaultTextColor,
  backgroundColor: defaultBackgroundColor,
  writingMode: 'horizontal-tb',
  textAlign: 'left',
  opacity: 100,
}
const userTheme = localStorage.getItem('theme')
const theme = reactive(userTheme ? JSON.parse(userTheme) : defaultTheme)

const getCSS = ({ fontFamily, fontSize, textColor, backgroundColor, writingMode, textAlign, lineHeight, opacity }) => {
  return `
    html {
      --theme-text-color: ${textColor};
      --theme-bg-color: ${backgroundColor};
      --theme-font-family: ${fontFamily};
      --theme-font-size: ${fontSize}%;
      --theme-writing-mode: ${writingMode || ''};
      --theme-text-align: ${textAlign};
      --theme-line-height: ${lineHeight};
    }
    * {
      color: var(--theme-text-color, transparent) !important;
      background-color: var(--theme-bg-color, transparent) !important;
      font-family: var(--theme-font-family) !important;
      font-size: var(--theme-font-size) !important;
      writing-mode: var(--theme-writing-mode) !important;
      line-height: var(--theme-line-height) !important;
      text-align: var(--theme-text-align) !important;
      padding: 0 !important;
      column-width: auto !important;
    }
    svg, img {
      background-color: transparent !important;
      mix-blend-mode: multiply;
    }
    `
}

const getRule = ({ fontFamily, fontSize, textColor, writingMode, backgroundColor, textAlign, lineHeight, opacity }) => {
  return {
    html: {
      '--theme-text-color': textColor,
      '--theme-bg-color': backgroundColor,
      '--theme-font-family': fontFamily,
      '--theme-font-size': `${fontSize}%`,
      '--theme-writing-mode': `${writingMode || ''}`,
      '--theme-text-align': textAlign,
      '--theme-line-height': lineHeight,
    },
    'html,body': {
      color: 'var(--theme-text-color, transparent) !important',
      'background-color': 'var(--theme-bg-color, transparent) !important',
      'font-family': 'var(--theme-font-family) !important',
      'font-size': 'var(--theme-font-size) !important',
      'writing-mode': 'var(--theme-writing-mode) !important',
      'text-align': 'var(--theme-text-align) !important',
      'line-height': 'var(--theme-line-height) !important',
    },
    '*': {
      color: 'var(--theme-text-color, transparent) !important',
    },
  }
}
const updatedTheme = (newTheme: any) => {
  if (!rendition.value) return
  if (isEpub()) {
    rendition.value.getContents().forEach((content) => {
      content.addStylesheetRules(getRule(newTheme))
    })
  } else {
    rendition.value.renderer?.setStyles && rendition.value.renderer.setStyles(getCSS(newTheme))
  }
  if (!isSidebar.value && vscode) {
    vscode.postMessage({
      type: 'style',
      content: JSON.stringify(newTheme),
    })
  }
}
watch(theme, (val) => {
  updatedTheme(val)
  console.log('theme', val)
  localStorage.setItem('theme', JSON.stringify(val))
})
export default function useTheme() {
  const restore = () => {
    Object.keys(defaultTheme).forEach((key) => {
      // @ts-ignore
      theme[key] = defaultTheme[key]
    })
  }
  /**
   * 解析rgba字符串，返回r,g,b,a值
   */
  const parseRgba = (rgbaStr: string): { r: number; g: number; b: number; a: number } | null => {
    const match = rgbaStr.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/)
    if (!match) return null

    return {
      r: parseInt(match[1]),
      g: parseInt(match[2]),
      b: parseInt(match[3]),
      a: match[4] ? parseFloat(match[4]) : 1,
    }
  }

  /**
   * 修改rgba的alpha值，保留2-3位小数
   * @param rgbaStr - rgba字符串
   * @param opacity - 透明度值(0-100)
   * @param decimals - 保留的小数位数，默认为2
   */
  const updateRgbaOpacity = (rgbaStr: string, opacity: number, decimals: number = 2): string => {
    const parsed = parseRgba(rgbaStr)
    if (!parsed) return rgbaStr

    // 将0-100的opacity转换为0-1的alpha值
    const alpha = opacity / 100

    // 保留指定位数小数
    const roundedAlpha = Math.round(alpha * Math.pow(10, decimals)) / Math.pow(10, decimals)

    // 如果roundedAlpha是整数，不显示小数位
    const finalAlpha = Number.isInteger(roundedAlpha) ? roundedAlpha : roundedAlpha.toFixed(decimals)

    return `rgba(${parsed.r}, ${parsed.g}, ${parsed.b}, ${finalAlpha})`
  }

  /**
   * 更新主题颜色透明度
   */
  const updateThemeOpacity = (theme: any, opacity: number) => {
    // 保留3位小数（更高的精度）
    theme.textColor = updateRgbaOpacity(theme.textColor, opacity, 3)
    return theme
  }
  watch(
    () => theme.opacity,
    (opacity) => {
      updateThemeOpacity(theme, opacity)
    },
  )
  onReady(() => {
    if (isEpub()) {
      rendition.value.hooks.content.register(() => updatedTheme(toRaw(theme)))
      rendition.value.on('relocated', () => {
        rendition.value.hooks.content.register(() => updatedTheme(toRaw(theme)))
      })
    } else {
      rendition.value.renderer?.setStyles && rendition.value.renderer.setStyles(getCSS(toRaw(theme)))
      rendition.value.addEventListener('load', () => {
        rendition.value.renderer?.setStyles && rendition.value.renderer.setStyles(getCSS(toRaw(theme)))
      })
    }
  })

  return { theme, restore, textList, backgroundList, fontFamilyList, textAlignList }
}
