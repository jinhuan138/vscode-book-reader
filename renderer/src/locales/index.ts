import { computed, ref, watch } from 'vue'
import { createI18n } from 'vue-i18n'
import elementEn from 'element-plus/es/locale/lang/en'
import elementZhCn from 'element-plus/es/locale/lang/zh-cn'
import en from './en'
import zhCn from './zh-CN'

export type SupportedLocale = 'en' | 'zh-CN'

const STORAGE_KEY = 'book-reader.locale'
const detectLocale = (): SupportedLocale => {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'en' || stored === 'zh-CN') return stored
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

export const appLocale = ref<SupportedLocale>(detectLocale())

export const i18n = createI18n({
  legacy: false,
  locale: appLocale.value,
  fallbackLocale: 'en',
  messages: {
    en,
    'zh-CN': zhCn,
  },
})

export const elementPlusLocale = computed(() =>
  appLocale.value === 'zh-CN' ? elementZhCn : elementEn
)

watch(appLocale, (locale) => {
  localStorage.setItem(STORAGE_KEY, locale)
  i18n.global.locale.value = locale
})
