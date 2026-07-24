export interface VoiceNode {
  value: string
  label: string
  children?: VoiceNode[]
}

// Edge ReadAloud TTS 语音列表，已通过免费端点逐个实测（单句合成，15s 超时判定），仅保留可用语音，中文置顶
// 数据来源: https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts
// 测试时间: 2026-07
export const edgeVoiceOptions: VoiceNode[] = [
  {
    value: 'zh-CN',
    label: '中文（普通话，简体）',
    children: [
      { value: 'zh-CN-XiaoxiaoNeural', label: '晓晓 (女声)' },
      { value: 'zh-CN-XiaoyiNeural', label: '小艺 (女声)' },
      { value: 'zh-CN-YunxiaNeural', label: '云霞 (男声)' },
      { value: 'zh-CN-YunxiNeural', label: '云希 (男声)' },
      { value: 'zh-CN-YunjianNeural', label: '云健 (男声)' },
      { value: 'zh-CN-YunyangNeural', label: '云扬 (男声)' },
    ],
  },
  {
    value: 'zh-CN-liaoning',
    label: '中文（东北官话）',
    children: [
      { value: 'zh-CN-liaoning-XiaobeiNeural', label: '小北 (女声)' },
    ],
  },
  {
    value: 'zh-CN-shaanxi',
    label: '中文（中原官话，陕西）',
    children: [
      { value: 'zh-CN-shaanxi-XiaoniNeural', label: '小妮 (女声)' },
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
      { value: 'en-US-AvaNeural', label: 'Ava (Female)' },
      { value: 'en-US-AvaMultilingualNeural', label: 'Ava Multilingual (Female)' },
      { value: 'en-US-AndrewNeural', label: 'Andrew (Male)' },
      { value: 'en-US-AndrewMultilingualNeural', label: 'Andrew Multilingual (Male)' },
      { value: 'en-US-EmmaNeural', label: 'Emma (Female)' },
      { value: 'en-US-EmmaMultilingualNeural', label: 'Emma Multilingual (Female)' },
      { value: 'en-US-BrianNeural', label: 'Brian (Male)' },
      { value: 'en-US-BrianMultilingualNeural', label: 'Brian Multilingual (Male)' },
      { value: 'en-US-JennyNeural', label: 'Jenny (Female)' },
      { value: 'en-US-GuyNeural', label: 'Guy (Male)' },
      { value: 'en-US-AriaNeural', label: 'Aria (Female)' },
      { value: 'en-US-AnaNeural', label: 'Ana (Female, Child)' },
      { value: 'en-US-ChristopherNeural', label: 'Christopher (Male)' },
      { value: 'en-US-EricNeural', label: 'Eric (Male)' },
      { value: 'en-US-MichelleNeural', label: 'Michelle (Female)' },
      { value: 'en-US-RogerNeural', label: 'Roger (Male)' },
      { value: 'en-US-SteffanNeural', label: 'Steffan (Male)' },
    ],
  },
  {
    value: 'en-GB',
    label: 'English (United Kingdom)',
    children: [
      { value: 'en-GB-SoniaNeural', label: 'Sonia (Female)' },
      { value: 'en-GB-RyanNeural', label: 'Ryan (Male)' },
      { value: 'en-GB-LibbyNeural', label: 'Libby (Female)' },
      { value: 'en-GB-MaisieNeural', label: 'Maisie (Female, Child)' },
      { value: 'en-GB-ThomasNeural', label: 'Thomas (Male)' },
    ],
  },
  {
    value: 'en-AU',
    label: 'English (Australia)',
    children: [
      { value: 'en-AU-NatashaNeural', label: 'Natasha (Female)' },
      { value: 'en-AU-WilliamNeural', label: 'William (Male)' },
      { value: 'en-AU-WilliamMultilingualNeural', label: 'William Multilingual (Male)' },
    ],
  },
  {
    value: 'en-CA',
    label: 'English (Canada)',
    children: [
      { value: 'en-CA-ClaraNeural', label: 'Clara (Female)' },
      { value: 'en-CA-LiamNeural', label: 'Liam (Male)' },
    ],
  },
  {
    value: 'en-NZ',
    label: 'English (New Zealand)',
    children: [
      { value: 'en-NZ-MollyNeural', label: 'Molly (Female)' },
      { value: 'en-NZ-MitchellNeural', label: 'Mitchell (Male)' },
    ],
  },
  {
    value: 'en-IN',
    label: 'English (India)',
    children: [
      { value: 'en-IN-NeerjaExpressiveNeural', label: 'Neerja Expressive (Female)' },
      { value: 'en-IN-NeerjaNeural', label: 'Neerja (Female)' },
      { value: 'en-IN-PrabhatNeural', label: 'Prabhat (Male)' },
    ],
  },
  {
    value: 'en-ZA',
    label: 'English (South Africa)',
    children: [
      { value: 'en-ZA-LeahNeural', label: 'Leah (Female)' },
      { value: 'en-ZA-LukeNeural', label: 'Luke (Male)' },
    ],
  },
  {
    value: 'en-HK',
    label: 'English (Hong Kong SAR)',
    children: [
      { value: 'en-HK-YanNeural', label: 'Yan (Female)' },
      { value: 'en-HK-SamNeural', label: 'Sam (Male)' },
    ],
  },
  {
    value: 'en-IE',
    label: 'English (Ireland)',
    children: [
      { value: 'en-IE-EmilyNeural', label: 'Emily (Female)' },
      { value: 'en-IE-ConnorNeural', label: 'Connor (Male)' },
    ],
  },
  {
    value: 'en-KE',
    label: 'English (Kenya)',
    children: [
      { value: 'en-KE-AsiliaNeural', label: 'Asilia (Female)' },
      { value: 'en-KE-ChilembaNeural', label: 'Chilemba (Male)' },
    ],
  },
  {
    value: 'en-NG',
    label: 'English (Nigeria)',
    children: [
      { value: 'en-NG-EzinneNeural', label: 'Ezinne (Female)' },
      { value: 'en-NG-AbeoNeural', label: 'Abeo (Male)' },
    ],
  },
  {
    value: 'en-PH',
    label: 'English (Philippines)',
    children: [
      { value: 'en-PH-RosaNeural', label: 'Rosa (Female)' },
      { value: 'en-PH-JamesNeural', label: 'James (Male)' },
    ],
  },
  {
    value: 'en-SG',
    label: 'English (Singapore)',
    children: [
      { value: 'en-SG-LunaNeural', label: 'Luna (Female)' },
      { value: 'en-SG-WayneNeural', label: 'Wayne (Male)' },
    ],
  },
  {
    value: 'en-TZ',
    label: 'English (Tanzania)',
    children: [
      { value: 'en-TZ-ImaniNeural', label: 'Imani (Female)' },
      { value: 'en-TZ-ElimuNeural', label: 'Elimu (Male)' },
    ],
  },
  {
    value: 'fr-FR',
    label: 'Français (France)',
    children: [
      { value: 'fr-FR-DeniseNeural', label: 'Denise (Female)' },
      { value: 'fr-FR-HenriNeural', label: 'Henri (Male)' },
      { value: 'fr-FR-EloiseNeural', label: 'Eloise (Female, Child)' },
    ],
  },
  {
    value: 'fr-CA',
    label: 'Français (Canada)',
    children: [
      { value: 'fr-CA-SylvieNeural', label: 'Sylvie (Female)' },
      { value: 'fr-CA-JeanNeural', label: 'Jean (Male)' },
      { value: 'fr-CA-AntoineNeural', label: 'Antoine (Male)' },
    ],
  },
  {
    value: 'ru-RU',
    label: 'Русский (Россия)',
    children: [
      { value: 'ru-RU-SvetlanaNeural', label: 'Svetlana (Female)' },
      { value: 'ru-RU-DmitryNeural', label: 'Dmitry (Male)' },
    ],
  },
  {
    value: 'es-ES',
    label: 'Español (España)',
    children: [
      { value: 'es-ES-ElviraNeural', label: 'Elvira (Female)' },
      { value: 'es-ES-AlvaroNeural', label: 'Alvaro (Male)' },
      { value: 'es-ES-XimenaNeural', label: 'Ximena (Female)' },
    ],
  },
  {
    value: 'es-MX',
    label: 'Español (México)',
    children: [
      { value: 'es-MX-DaliaNeural', label: 'Dalia (Female)' },
      { value: 'es-MX-JorgeNeural', label: 'Jorge (Male)' },
    ],
  },
  {
    value: 'es-AR',
    label: 'Español (Argentina)',
    children: [
      { value: 'es-AR-ElenaNeural', label: 'Elena (Female)' },
      { value: 'es-AR-TomasNeural', label: 'Tomas (Male)' },
    ],
  },
  {
    value: 'hi-IN',
    label: 'हिन्दी (भारत)',
    children: [
      { value: 'hi-IN-SwaraNeural', label: 'Swara (Female)' },
      { value: 'hi-IN-MadhurNeural', label: 'Madhur (Male)' },
    ],
  },
  {
    value: 'ar-SA',
    label: 'العربية (السعودية)',
    children: [
      { value: 'ar-SA-ZariyahNeural', label: 'Zariyah (Female)' },
      { value: 'ar-SA-HamedNeural', label: 'Hamed (Male)' },
    ],
  },
  {
    value: 'ar-EG',
    label: 'العربية (مصر)',
    children: [
      { value: 'ar-EG-SalmaNeural', label: 'Salma (Female)' },
      { value: 'ar-EG-ShakirNeural', label: 'Shakir (Male)' },
    ],
  },
]
