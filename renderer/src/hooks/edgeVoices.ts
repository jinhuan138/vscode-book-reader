export interface VoiceNode {
  value: string
  label: string
  children?: VoiceNode[]
}

// Azure TTS 语音列表，已通过免费端点逐个实测（单句合成，5s 超时判定），仅保留可用语音，中文置顶
// 数据来源: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
export const edgeVoiceOptions: VoiceNode[] = [
  {
    value: 'zh-CN',
    label: '中文（普通话，简体）',
    children: [
      { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)' },
      { value: 'zh-CN-YunxiNeural', label: '云希 (男声)' },
      { value: 'zh-CN-YunjianNeural', label: '云健 (男声)' },
      { value: 'zh-CN-XiaoyiNeural', label: '小艺 (女声)' },
      { value: 'zh-CN-YunyangNeural', label: '云扬 (男声)' },
      { value: 'zh-CN-YunxiaNeural', label: '云霞 (男声)' },
      { value: 'zh-CN-liaoning-XiaobeiNeural', label: '辽宁·小北 (女声)' },
      { value: 'zh-CN-shaanxi-XiaoniNeural', label: '陕西·小妮 (女声)' },
    ],
  },
  {
    value: 'zh-TW',
    label: '中文（台湾普通话，繁体）',
    children: [
      { value: 'zh-TW-HsiaoChenNeural', label: '晓珍 (女声)' },
      { value: 'zh-TW-YunJheNeural', label: '云哲 (男声)' },
      { value: 'zh-TW-HsiaoYuNeural', label: '晓雨 (女声)' },
    ],
  },
  {
    value: 'zh-HK',
    label: '中文（粤语，繁体）',
    children: [
      { value: 'zh-HK-HiuMaanNeural', label: '晓敏 (女声)' },
      { value: 'zh-HK-WanLungNeural', label: '云龙 (男声)' },
      { value: 'zh-HK-HiuGaaiNeural', label: '晓佳 (女声)' },
    ],
  },
  {
    value: 'en-US',
    label: 'English (United States)',
    children: [
      { value: 'en-US-AvaNeural', label: 'en-US-AvaNeural (Female)' },
      { value: 'en-US-AndrewNeural', label: 'en-US-AndrewNeural (Male)' },
      { value: 'en-US-EmmaNeural', label: 'en-US-EmmaNeural (Female)' },
      { value: 'en-US-BrianNeural', label: 'en-US-BrianNeural (Male)' },
      { value: 'en-US-JennyNeural', label: 'en-US-JennyNeural (Female)' },
      { value: 'en-US-GuyNeural', label: 'en-US-GuyNeural (Male)' },
      { value: 'en-US-AriaNeural', label: 'en-US-AriaNeural (Female)' },
      { value: 'en-US-AnaNeural', label: 'en-US-AnaNeural (Female, Child)' },
      { value: 'en-US-ChristopherNeural', label: 'en-US-ChristopherNeural (Male)' },
      { value: 'en-US-EricNeural', label: 'en-US-EricNeural (Male)' },
      { value: 'en-US-MichelleNeural', label: 'en-US-MichelleNeural (Female)' },
      { value: 'en-US-RogerNeural', label: 'en-US-RogerNeural (Male)' },
      { value: 'en-US-SteffanNeural', label: 'en-US-SteffanNeural (Male)' },
    ],
  },
  {
    value: 'en-GB',
    label: 'English (United Kingdom)',
    children: [
      { value: 'en-GB-SoniaNeural', label: 'en-GB-SoniaNeural (Female)' },
      { value: 'en-GB-RyanNeural', label: 'en-GB-RyanNeural (Male)' },
      { value: 'en-GB-LibbyNeural', label: 'en-GB-LibbyNeural (Female)' },
      { value: 'en-GB-MaisieNeural', label: 'en-GB-MaisieNeural (Female, Child)' },
      { value: 'en-GB-ThomasNeural', label: 'en-GB-ThomasNeural (Male)' },
    ],
  },
  {
    value: 'en-CA',
    label: 'English (Canada)',
    children: [
      { value: 'en-CA-ClaraNeural', label: 'en-CA-ClaraNeural (Female)' },
      { value: 'en-CA-LiamNeural', label: 'en-CA-LiamNeural (Male)' },
    ],
  },
  {
    value: 'en-AU',
    label: 'English (Australia)',
    children: [
      { value: 'en-AU-NatashaNeural', label: 'en-AU-NatashaNeural (Female)' },
      { value: 'en-AU-WilliamNeural', label: 'en-AU-WilliamNeural (Male)' },
    ],
  },
  {
    value: 'en-NZ',
    label: 'English (New Zealand)',
    children: [
      { value: 'en-NZ-MollyNeural', label: 'en-NZ-MollyNeural (Female)' },
      { value: 'en-NZ-MitchellNeural', label: 'en-NZ-MitchellNeural (Male)' },
    ],
  },
  {
    value: 'en-IN',
    label: 'English (India)',
    children: [
      { value: 'en-IN-NeerjaNeural', label: 'en-IN-NeerjaNeural (Female)' },
      { value: 'en-IN-PrabhatNeural', label: 'en-IN-PrabhatNeural (Male)' },
    ],
  },
  {
    value: 'en-ZA',
    label: 'English (South Africa)',
    children: [
      { value: 'en-ZA-LeahNeural', label: 'en-ZA-LeahNeural (Female)' },
      { value: 'en-ZA-LukeNeural', label: 'en-ZA-LukeNeural (Male)' },
    ],
  },
  {
    value: 'fr-FR',
    label: 'Français (France)',
    children: [
      { value: 'fr-FR-DeniseNeural', label: 'fr-FR-DeniseNeural (Female)' },
      { value: 'fr-FR-HenriNeural', label: 'fr-FR-HenriNeural (Male)' },
      { value: 'fr-FR-EloiseNeural', label: 'fr-FR-EloiseNeural (Female, Child)' },
    ],
  },
  {
    value: 'fr-CA',
    label: 'Français (Canada)',
    children: [
      { value: 'fr-CA-SylvieNeural', label: 'fr-CA-SylvieNeural (Female)' },
      { value: 'fr-CA-JeanNeural', label: 'fr-CA-JeanNeural (Male)' },
      { value: 'fr-CA-AntoineNeural', label: 'fr-CA-AntoineNeural (Male)' },
      { value: 'fr-CA-ThierryNeural', label: 'fr-CA-ThierryNeural (Male)' },
    ],
  },
  {
    value: 'ru-RU',
    label: 'Русский (Россия)',
    children: [
      { value: 'ru-RU-SvetlanaNeural', label: 'ru-RU-SvetlanaNeural (Female)' },
      { value: 'ru-RU-DmitryNeural', label: 'ru-RU-DmitryNeural (Male)' },
    ],
  },
  {
    value: 'es-ES',
    label: 'Español (España)',
    children: [
      { value: 'es-ES-ElviraNeural', label: 'es-ES-ElviraNeural (Female)' },
      { value: 'es-ES-AlvaroNeural', label: 'es-ES-AlvaroNeural (Male)' },
      { value: 'es-ES-XimenaNeural', label: 'es-ES-XimenaNeural (Female)' },
    ],
  },
  {
    value: 'es-MX',
    label: 'Español (México)',
    children: [
      { value: 'es-MX-DaliaNeural', label: 'es-MX-DaliaNeural (Female)' },
      { value: 'es-MX-JorgeNeural', label: 'es-MX-JorgeNeural (Male)' },
    ],
  },
  {
    value: 'es-AR',
    label: 'Español (Argentina)',
    children: [
      { value: 'es-AR-ElenaNeural', label: 'es-AR-ElenaNeural (Female)' },
      { value: 'es-AR-TomasNeural', label: 'es-AR-TomasNeural (Male)' },
    ],
  },
  {
    value: 'hi-IN',
    label: 'हिन्दी (भारत)',
    children: [
      { value: 'hi-IN-SwaraNeural', label: 'hi-IN-SwaraNeural (Female)' },
      { value: 'hi-IN-MadhurNeural', label: 'hi-IN-MadhurNeural (Male)' },
    ],
  },
  {
    value: 'ar-SA',
    label: 'العربية (السعودية)',
    children: [
      { value: 'ar-SA-ZariyahNeural', label: 'ar-SA-ZariyahNeural (Female)' },
      { value: 'ar-SA-HamedNeural', label: 'ar-SA-HamedNeural (Male)' },
    ],
  },
  {
    value: 'ar-EG',
    label: 'العربية (مصر)',
    children: [
      { value: 'ar-EG-SalmaNeural', label: 'ar-EG-SalmaNeural (Female)' },
      { value: 'ar-EG-ShakirNeural', label: 'ar-EG-ShakirNeural (Male)' },
    ],
  },
]
