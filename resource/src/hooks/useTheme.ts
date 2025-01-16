import { reactive, watch, toRaw } from 'vue'
import useRendition from './useRendition'
import useVscode from './useVscode'

const vscode = useVscode()

const userTheme = localStorage.getItem('theme')
const theme = reactive(
  userTheme
    ? JSON.parse(userTheme)
    : {
        fontSize: 100,
        font: '',
        lineSpacing: 1.5,
        textColor: '#000',
        backgroundColor: '#fff',
        writingMode: 'horizontal-tb',
      },
)

const [rendition] = useRendition()
const getCSS = ({
  font,
  fontSize,
  lineSpacing,
  textColor,
  backgroundColor,
  writingMode,
}) => {
  return [
    `
  * {
    font-family: ${font || '!invalid-hack'};
    font-size:  ${fontSize}%;
    color: ${textColor};
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
    line-height: ${lineSpacing} !important;
    font-size: ${fontSize}% !important;
    color: ${textColor} !important;
    background-color: ${backgroundColor} !important;
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

const getRule = ({
  font,
  fontSize,
  lineSpacing,
  textColor,
  writingMode,
  backgroundColor,
}) => {
  return {
    body: {
      'font-family': font !== '' ? `${font} !important` : '!invalid-hack',
      color: `${textColor} !important`,
      'background-color': backgroundColor,
      'writing-mode': writingMode,
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
      'font-size':
        fontSize !== '' ? `${fontSize}% !important` : '!invalid-hack',
      color: `${textColor} !important`,
      'background-color': backgroundColor,
    },
  }
}
export default function useTheme(isSlider = false) {
  const updatedTheme = (newTheme) => {
    if (!rendition.value) return
    if (!rendition.value.shadowRoot) {
      rendition.value.getContents().forEach((content) => {
        const rule = getRule(newTheme)
        content.addStylesheetRules(rule)
      })
    } else {
      rendition.value.renderer?.setStyles &&
        rendition.value.renderer.setStyles(getCSS(newTheme))
    }
    if (!isSlider && vscode) {
      vscode.postMessage({
        type: 'style',
        content: JSON.stringify(newTheme),
      })
    }
  }

  watch(theme, (val) => {
    updatedTheme(val)
    console.log('update')
    localStorage.setItem('theme', JSON.stringify(val))
  })
  watch(rendition, (instance) => {
    const style = toRaw(theme)
    if (!instance.shadowRoot) {
      instance.hooks.content.register(() => updatedTheme(style))
      instance.on('relocated', () => {
        instance.hooks.content.register(() => updatedTheme(style))
      })
    } else {
      updatedTheme(style)
    }
  })
  return theme
}
