import { reactive, watch, toRaw } from 'vue'
import useRendition from './useRendition'
import useVscode from './useVscode'

const defaultTheme = {
  fontSize: 100,
  font: '',
  lineHeight: 1.5,
  textColor: 'var(--vscode-editor-foreground,rgba(0,0,0,1))',
  backgroundColor: 'var(--vscode-editor-background,rgba(255,255,255,1))',
  writingMode: 'horizontal-tb',
  textAlign: 'left',
  opacity: 1,
}
const backgroundList = [
  'var(--vscode-editor-background,rgba(255,255,255,1))',
  'rgba(44,47,49,1)',
  'rgba(233, 216, 188,1)',
  'rgba(197, 231, 207,1)',
]

const textList = [
  'var(--vscode-editor-foreground,rgba(0,0,0,1))',
  'rgba(255,255,255,1)',
  'rgba(89, 68, 41,1)',
  'rgba(54, 80, 62,1)',
]
const fontFamilyList = [
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
const userTheme = localStorage.getItem('theme')
const theme = reactive(userTheme ? JSON.parse(userTheme) : defaultTheme)

const [rendition] = useRendition()
const getCSS = ({ font, fontSize, textColor, backgroundColor, writingMode, textAlign, lineHeight, opacity }) => {
  return [
    `
  * {
    font-family: ${font || '!invalid-hack'};
    font-size:  ${fontSize}%;
    color: ${textColor};
    opacity: ${opacity};
  }
  
  a {
    color: 'inherit !important',
  }
  
  a:link: {
    color: '#1e83d2 !important',
  }
  
  body {
    font-family: ${font || '!invalid-hack'} !important;
    writing-mode:${writingMode || ''} !important;
    color: ${textColor} !important;
    background-color: ${backgroundColor} !important;
  }
  
  html,body {
    line-height: ${lineHeight} !important;
    font-size: ${fontSize}% !important;
    color: ${textColor} !important;
    background-color: ${backgroundColor} !important;
    text-align: ${textAlign} !important;
    padding: 0 !important;
    column-width: auto !important;
    height: auto !important;
    width: auto !important;
  }
  svg, img {
    background-color: transparent !important;
    mix-blend-mode: multiply;
  }
  img, image {
    cursor: pointer !important;
  }
  `,
  ]
}

const getRule = ({ font, fontSize, textColor, writingMode, backgroundColor, textAlign, lineHeight, opacity }) => {
  return {
    body: {
      'font-family': font !== '' ? `${font} !important` : '!invalid-hack',
      color: `${textColor} !important`,
      'background-color': backgroundColor,
      'writing-mode': writingMode,
      'text-align': `${textAlign} !important`,
      'line-height': `${lineHeight} !important`,
    },
    a: {
      color: 'inherit !important',
      'text-decoration': 'none !important',
      '-webkit-text-fill-color': 'inherit !important',
    },
    'a:link': {
      color: `#1e83d2 !important`,
      'text-decoration': 'none !important',
      '-webkit-text-fill-color': `#1e83d2 !important`,
    },
    'a:link:hover': {
      background: 'rgba(0, 0, 0, 0.1) !important',
    },
    '*': {
      'font-family': font !== '' ? `${font} !important` : '!invalid-hack',
      'font-size': fontSize !== '' ? `${fontSize}% !important` : '!invalid-hack',
      color: `${textColor} !important`,
      'background-color': backgroundColor,
      opacity: opacity,
    },
  }
}
export default function useTheme(isSlider = false) {
  const updatedTheme = (newTheme) => {
    if (!rendition.value) return
    if (!rendition.value.tagName) {
      rendition.value.getContents().forEach((content) => {
        const rule = getRule(newTheme)
        content.addStylesheetRules(rule)
      })
    } else {
      rendition.value.renderer?.setStyles && rendition.value.renderer.setStyles(getCSS(newTheme))
    }
    if (!isSlider && vscode) {
      vscode.postMessage({
        type: 'style',
        content: JSON.stringify(newTheme),
      })
    }
  }

  const restore = () => {
    Object.keys(defaultTheme).forEach((key) => {
      // @ts-ignore
      theme[key] = defaultTheme[key]
    })
  }
  watch(theme, (val) => {
    updatedTheme(val)
    console.log('update theme')
    localStorage.setItem('theme', JSON.stringify(val))
  })
  watch(rendition, (instance) => {
    const style = toRaw(theme)
    if (!instance.tagName) {
      instance.hooks.content.register(() => updatedTheme(style))
      instance.on('relocated', () => {
        instance.hooks.content.register(() => updatedTheme(style))
      })
    } else {
      updatedTheme(style)
    }
  })
  return { theme, restore, textList, backgroundList, fontFamilyList, textAlignList }
}
