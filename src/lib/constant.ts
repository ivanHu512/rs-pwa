export const UID_COOKIE_KEY = "uid";
export const LANGUAGE_COOKIE_KEY = "language";

export const localKeyUser = 'userInfo'
export const localKeyUid = 'uid'
export const localKeyDevId = 'devId'
export const localKeyHand = 'hand'
export const localKeyProduct = 'select-product'
export const localModel = 'h5mode'

export const sessionKeyNextChapter = 'cpId'
export const sessionKeyCurrentChapter = 'currentCpId'

export const API_VERSION = '1.4.4'
export const CLIENT_VER = '2.0.10'

export const urlChapterIdKey = 'cpId'
export const urlChapterSortKey = 'sort'
export const localKeyVipLocked = 'vipLocked'
export const sessionKeyTraceId = 'playTraceId'

export const localKeyPwaStatus = 'pwaStatus'

// 登陆绑定类型
export const LoginBindType = ['vistor', 'apple', 'fb', 'gp', '', 'tt']

export const CHANNEL_ID = 'WEB42003'

// Adyen 支付结果状态码
export const PAYMENT_RESULT = {
  AUTHORISED: 'Authorised',
  PENDING: 'Pending',
  REFUSED: 'Refused',
  ERROR: 'Error',
  CANCELLED: 'Cancelled',
} as const

//https://github.com/Adyen/adyen-web/tree/main/packages/server/translations
export const localsMap: any = {
  en: 'en-US',
  es: 'es-ES',
  pt: 'pt-PT',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ru: 'ru-RU',
  'zh-TW': 'zh-TW',
  de: 'de-DE',
  fr: 'fr-FR',
  ar: 'ar',
  it: 'it-IT',
  pl: 'pl-PL',
  ro: 'ro-RO',
  //adyen 不支持的多语言
  in: 'id', // 印尼应该是id-ID
  th: 'th-TH',
  hi: 'hi',
  fil: 'fil',
  tr: 'tr',
}

export const sessionKey = 'session'
export const languageKey = 'language'
export const sessionVideoProgress = 'videoProgress'
