import type { CSSProperties } from 'react'

/** Solid/gradient CSS background, optionally with inset shadow for branded CTAs */
export type SiteButtonBg = string | { background: string; boxShadow?: string }

export interface SiteButtonOverlay {
  background: string
  mixBlendMode?: CSSProperties['mixBlendMode']
  opacity?: number
}

export type VipSuccessDividerColor =
  | string
  | {
      diamond: string
      start: string
      center: string
      end: string
    }

export function siteButtonBgStyle(buttonBg?: SiteButtonBg): CSSProperties {
  if (buttonBg == null) return {}
  return {
    background: 'var(--button-bg)',
    boxShadow: 'var(--button-shadow)',
  }
}

export function siteButtonOverlayStyle(
  buttonOverlay?: SiteButtonOverlay
): CSSProperties {
  if (buttonOverlay == null) return {}
  const { background, mixBlendMode, opacity } = buttonOverlay
  return {
    background,
    ...(mixBlendMode != null ? { mixBlendMode } : {}),
    ...(opacity != null ? { opacity } : {}),
  }
}

export interface SiteConfig {
  title: string
  description: string
  metadataBase?: string
  favicon: string // 48 * 48
  headerLogo?: string
  appleTouchIcon?: {
    512: string
    324: string
    220: string
    192: string
    180: string
    167: string
    120: string
  }
  siteNameIcon?: string
  channelId?: string
  theme?: {
    primary: string // HSL format, e.g., "0 72.2% 50.6%"
  }
  coinIcon: string
  vipIcon: string
  vipBigIcon: string
  vipBigIconDeg?: number
  vipBigIconHeight?: number
  vipBgMask: string
  vipTextColor: string
  vipTextColor2: string
  vipBottomTextColor?: string
  vipListBg: string
  vipStatusBg?: string
  vipBottomBgColor: string
  tryAgainIcon: string
  unpublishIcon: string
  retentionModalBg: string
  userAgreement?: string
  privacyAgreement?: string
  supportEmail?: string
  vipSuccessBg: string
  vipSuccessBorder?: CSSProperties['border']
  facebookAppId: string
  appleClientId?: string
  firebase: {
    apiKey: string
    authDomain: string
    projectId: string
    storageBucket: string
    messagingSenderId: string
    appId: string
    measurementId: string
  }
  pwaBorderColor?: string
  unlockedToastBg?: string
  unlockedToastBoxShadow?: string
  unlockedToastTextColor?: string
  vipSuccessTextColor1: string
  vipSuccessTextColor2: string
  vipSuccessbenefitsTextColor: string
  vipSuccessTextColor3: string
  vipSuccessDividerColor?: VipSuccessDividerColor
  vipSuccessToplight?: string
  vipIconGradientFrom: string
  vipIconGradientTo: string
  discountBg?: string
  buttonBg: SiteButtonBg
  buttonOverlay?: SiteButtonOverlay
  lockBg?: string
  adyen?: {
    env: string
    clientKey: string
  }
  aliPlayer?: {
    licenseDomain: string
  }
}

// ReelShort
// test-delivery-drama-web.epubgame.com/
// gray-drama.reelshort.com
// drama.reelshort.com

// B25Drama
// test-drama.b25reel.com
// gray-drama.b25reel.com
// drama.b25reel.com

// B25Short
// test-short.b25reel.com
// gray-short.b25reel.com
// short.b25reel.com

// SweetDrama
// test-drama.sweetmaxbest.com
// gray-drama.sweetmaxbest.com
// drama.sweetmaxbest.com

// SweetShort
// test-short.sweetmaxbest.com
// gray-short.sweetmaxbest.com
// short.sweetmaxbest.com

// B25Binge
// test-binge.b25reel.com
// gray-binge.b25reel.com
// binge.b25reel.com

// B25Watch
// test-watch.b25reel.com
// gray-watch.b25reel.com
// watch.b25reel.com

// SweetBinge
// test-binge.sweetmaxbest.com
// gray-binge.sweetmaxbest.com
// binge.sweetmaxbest.com

// SweetWatch
// test-watch.sweetmaxbest.com
// gray-watch.sweetmaxbest.com
// watch.sweetmaxbest.com

const CHANNEL_IDS = {
  reelShort: {
    test: 'TEST42003',
    gray: 'GRAY42003',
    web: 'WEB42003',
  },
  b25Drama: {
    test: 'TEST42004',
    gray: 'GRAY42004',
    web: 'WEB42004',
  },
  b25Short: {
    test: 'TEST42005',
    gray: 'GRAY42005',
    web: 'WEB42005',
  },
  sweetDrama: {
    test: 'TEST42006',
    gray: 'GRAY42006',
    web: 'WEB42006',
  },
  sweetShort: {
    test: 'TEST42007',
    gray: 'GRAY42007',
    web: 'WEB42007',
  },
  b25Binge: {
    test: 'TEST42008',
    gray: 'GRAY42008',
    web: 'WEB42008',
  },
  b25Watch: {
    test: 'TEST42009',
    gray: 'GRAY42009',
    web: 'WEB42009',
  },
  sweetBinge: {
    test: 'TEST42010',
    gray: 'GRAY42010',
    web: 'WEB42010',
  },
  sweetWatch: {
    test: 'TEST42011',
    gray: 'GRAY42011',
    web: 'WEB42011',
  },
} as const

const ADYEN_CONFIG = {
  reelShort: {
    live: 'live_WCCV4VJMNFESTNI2F2JCWNGPSQCLQON5',
    test: 'test_BVSLBQVIIVHCRFPUA7HITFUU7QWVXUEW',
  },
  b25: {
    live: 'live_DZGLLI2V2RFJNIRT2PMFD347OUIFWJU6',
    test: 'test_FT3AJTO4ZFG7ZFX3ZEKBN5IUVE3S5F5I',
  },
  sweet: {
    live: 'live_2YFADZVLFJEGHCIXEN7SCV7GEEZOWWFM',
    test: 'test_GZY5HTG6SNFXZCWVLQ6QAR5SVYFGEPML',
  },
} as const

function createAdyenConfig(env: 'live' | 'test', clientKey: string) {
  return { env, clientKey }
}

const REELSHORT_CONFIG: SiteConfig = {
  title: 'ReelShort',
  description: 'ReelShort',
  metadataBase: 'https://drama.reelshort.com',
  favicon:
    'https://v-mps.crazymaplestudios.com/images/4465cc00-c482-11f0-84ad-6b5693b490dc.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/2cd3d600-d98a-11f0-84ad-6b5693b490dc.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/ba1c02e0-da42-11f0-84ad-6b5693b490dc.png',
    324: 'https://v-mps.crazymaplestudios.com/images/93cf0500-d732-11f0-84ad-6b5693b490dc.png',
    220: 'https://v-mps.crazymaplestudios.com/images/93cce220-d732-11f0-84ad-6b5693b490dc.png',
    192: 'https://v-mps.crazymaplestudios.com/images/ba1aca60-da42-11f0-84ad-6b5693b490dc.png',
    180: 'https://v-mps.crazymaplestudios.com/images/ba19b8f0-da42-11f0-84ad-6b5693b490dc.png',
    167: 'https://v-mps.crazymaplestudios.com/images/ba10b840-da42-11f0-84ad-6b5693b490dc.png',
    120: 'https://v-mps.crazymaplestudios.com/images/93c2f710-d732-11f0-84ad-6b5693b490dc.png',
  },
  channelId: CHANNEL_IDS.reelShort.web,
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/2821c8a0-2747-11f1-84ad-6b5693b490dc.png',
  theme: {
    primary: '0 78% 54%',
  },
  buttonBg: '#e52e2e',
  discountBg: 'linear-gradient(90deg, #E52E2E 0%, #EB4C46 100%)',
  lockBg: '#e52e2e',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/047c8ae0-6561-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/fe2e3620-c4ed-11f0-84ad-6b5693b490dc.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/4969cbe0-b6ed-11f0-b4b4-bd031586a1b7.png',
  vipBigIconDeg: 0,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/75d06810-12e1-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#401A06',
  unlockedToastTextColor: '#401A06',
  vipTextColor2: 'rgba(64, 26, 6, 0.7)',
  vipSuccessTextColor1:
    'linear-gradient(to right, #F2CA91 0%, #FFF0DC 50%, #F2CA91 100%)',
  vipSuccessTextColor2: 'rgb(250 231 191 / 0.7)',
  vipSuccessbenefitsTextColor: 'rgb(250 231 191 / 0.7)',
  vipSuccessTextColor3: 'rgb(255 235 202 / 0.7)',
  vipSuccessBg:
    'radial-gradient(216.88% 100% at 49.84% 0%, #AE5C18 0%, #69351C 7.53%, rgba(51, 31, 24, 0.80) 18.06%, rgba(27, 16, 13, 0.00) 28%) padding-box, linear-gradient(#1B100D, #1B100D) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  vipListBg: 'linear-gradient(to right, #F2CA91, #FFF0DC)',
  vipStatusBg:
    'linear-gradient(to right, #F2CA91, #FFF0DC) padding-box, linear-gradient(to bottom, rgba(240, 201, 134, 0.2), rgba(2, 2, 1, 0.2)) border-box',
  vipIconGradientFrom: '#693D27',
  vipIconGradientTo: '#401906',
  vipBottomBgColor: '#FDECD3',
  tryAgainIcon:
    'https://v-mps.crazymaplestudios.com/images/69944f90-e0c2-11f0-84ad-6b5693b490dc.png',
  unpublishIcon:
    'https://v-mps.crazymaplestudios.com/images/ec2b3550-e0c1-11f0-84ad-6b5693b490dc.png',
  retentionModalBg:
    'https://v-mps.crazymaplestudios.com/images/763b6300-d695-11f0-84ad-6b5693b490dc.png',
  userAgreement: '/h5-terms-of-use.html',
  privacyAgreement: '/h5-privacy-policy.html',
  unlockedToastBg:
    'linear-gradient(to right, #FFF0DC, #F2CA91) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  facebookAppId: '435852711476248',
  appleClientId: 'com.newleaf.reelshort.applesignin',
  firebase: {
    apiKey: 'AIzaSyB5VW0UqyW5A3OZYy25_gPgzjNoYbiBW0g',
    authDomain: 'reelshort-f4f21.firebaseapp.com',
    projectId: 'reelshort-f4f21',
    storageBucket: 'reelshort-f4f21.appspot.com',
    messagingSenderId: '384097992766',
    appId: '1:384097992766:web:6dfbbdc33822d5f47c916f',
    measurementId: 'G-35LR42RVBJ',
  },
  adyen: createAdyenConfig('live', ADYEN_CONFIG.reelShort.live),
  aliPlayer: { licenseDomain: 'reelshort.com' },
}

const TEST_REELSHORT_CONFIG: SiteConfig = {
  ...REELSHORT_CONFIG,
  channelId: CHANNEL_IDS.reelShort.test,
  firebase: {
    apiKey: 'AIzaSyB3prxAZABnUEty91SkaFFbmmQN5qwVBpA',
    authDomain: 'reelshort-26c6c.firebaseapp.com',
    projectId: 'reelshort-26c6c',
    storageBucket: 'reelshort-26c6c.appspot.com',
    messagingSenderId: '616963523381',
    appId: '1:616963523381:web:70bd8c29e4e8d2671a027c',
    measurementId: 'G-20YEWYYHW3',
  },
  adyen: createAdyenConfig('test', ADYEN_CONFIG.reelShort.test),
  aliPlayer: {
    licenseDomain: 'epubgame.com',
  },
}

const B25DRAMA_CONFIG: SiteConfig = {
  title: 'B25Drama',
  description: 'B25Drama',
  metadataBase: 'https://drama.b25reel.com',
  favicon:
    'https://v-mps.crazymaplestudios.com/images/1cc43b70-1b97-11f1-84ad-6b5693b490dc.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/9c7ad1e0-1475-11f1-84ad-6b5693b490dc.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/6de16630-1602-11f1-84ad-6b5693b490dc.png',
    324: 'https://v-mps.crazymaplestudios.com/images/6de16630-1602-11f1-84ad-6b5693b490dc.png',
    220: 'https://v-mps.crazymaplestudios.com/images/7a6dd500-1602-11f1-84ad-6b5693b490dc.png',
    192: 'https://v-mps.crazymaplestudios.com/images/8906dcb0-1602-11f1-84ad-6b5693b490dc.png',
    180: 'https://v-mps.crazymaplestudios.com/images/97224ff0-1602-11f1-84ad-6b5693b490dc.png',
    167: 'https://v-mps.crazymaplestudios.com/images/b2198a80-1602-11f1-84ad-6b5693b490dc.png',
    120: 'https://v-mps.crazymaplestudios.com/images/c432df50-1602-11f1-84ad-6b5693b490dc.png',
  },
  channelId: CHANNEL_IDS.b25Drama.web,
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/cb4e3b70-2743-11f1-84ad-6b5693b490dc.png',
  theme: {
    primary: '15 93% 55%',
  },
  buttonBg: '#f75722',
  discountBg: '#f75722',
  lockBg: '#f75722',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/e092ff60-6538-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/27508390-191d-11f1-84ad-6b5693b490dc.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/7045ec60-191e-11f1-84ad-6b5693b490dc.png',
  vipBigIconDeg: 0,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/83550b80-1921-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#F2CA91',
  unlockedToastTextColor: '#F2CA91',
  vipTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor1: '#F2CA91',
  vipSuccessTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessbenefitsTextColor: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.90)',
  vipIconGradientFrom: '#F4EDC8',
  vipIconGradientTo: '#F2CA91',
  vipBottomBgColor: 'rgba(88, 62, 39, 1)',
  tryAgainIcon:
    'https://v-mps.crazymaplestudios.com/images/46c2d740-1923-11f1-84ad-6b5693b490dc.png',
  unpublishIcon:
    'https://v-mps.crazymaplestudios.com/images/c0eb1e60-1923-11f1-84ad-6b5693b490dc.png',
  retentionModalBg:
    'https://v-mps.crazymaplestudios.com/images/bec36720-1bba-11f1-84ad-6b5693b490dc.png',
  supportEmail: 'support@b25reel.com',
  vipListBg:
    'linear-gradient(to right, rgba(45, 32, 23, 1), rgba(88, 62, 39, 1))',
  vipStatusBg:
    'linear-gradient(to right, rgba(45, 32, 23, 1), rgba(88, 62, 39, 1)) padding-box, linear-gradient(to bottom, rgba(240, 201, 134, 0.2), rgba(255, 245, 218, 0.2)) border-box',
  vipSuccessBg:
    'radial-gradient(216.88% 100% at 49.84% 0%, #B48543 0%, #644820 8%, #332A1E 18%, #1B1610 28%) padding-box, linear-gradient(#1F1610, #1F1610) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  unlockedToastBg:
    'linear-gradient(to right, rgba(45, 32, 23, 1), rgba(88, 62, 39, 1)) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  facebookAppId: '1579523770202035',
  appleClientId: 'com.b25.b25reel.applesignin',
  firebase: {
    apiKey: 'AIzaSyCwrjmoV9Wy2unUw-ZkhRcW8z4AL7gnQYI',
    authDomain: 'b25reel.firebaseapp.com',
    projectId: 'b25reel',
    storageBucket: 'b25reel.firebasestorage.app',
    messagingSenderId: '697277545086',
    appId: '1:697277545086:web:3068b686507f88714bf62f',
    measurementId: 'G-F2H1Z1SHXT',
  },
  adyen: createAdyenConfig('live', ADYEN_CONFIG.b25.live),
  aliPlayer: { licenseDomain: 'b25reel.com' },
}

const TEST_B25DRAMA_CONFIG: SiteConfig = {
  ...B25DRAMA_CONFIG,
  channelId: CHANNEL_IDS.b25Drama.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.b25.test),
  aliPlayer: { licenseDomain: 'b25reel.com' },
}

const B25SHORT_CONFIG: SiteConfig = {
  title: 'B25Short',
  description: 'B25Short',
  metadataBase: 'https://short.b25reel.com',
  favicon:
    'https://v-mps.crazymaplestudios.com/images/e146d260-1902-11f1-84ad-6b5693b490dc.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/a9123340-1901-11f1-84ad-6b5693b490dc.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/e1585e90-1902-11f1-84ad-6b5693b490dc.png',
    324: 'https://v-mps.crazymaplestudios.com/images/e14a2dc0-1902-11f1-84ad-6b5693b490dc.png',
    220: 'https://v-mps.crazymaplestudios.com/images/e154b510-1902-11f1-84ad-6b5693b490dc.png',
    192: 'https://v-mps.crazymaplestudios.com/images/e159e530-1902-11f1-84ad-6b5693b490dc.png',
    180: 'https://v-mps.crazymaplestudios.com/images/e15b1db0-1902-11f1-84ad-6b5693b490dc.png',
    167: 'https://v-mps.crazymaplestudios.com/images/e140b7e0-1902-11f1-84ad-6b5693b490dc.png',
    120: 'https://v-mps.crazymaplestudios.com/images/e144af80-1902-11f1-84ad-6b5693b490dc.png',
  },
  channelId: CHANNEL_IDS.b25Short.web,
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/cb4e3b70-2743-11f1-84ad-6b5693b490dc.png',
  theme: {
    primary: '243, 100%, 73%',
  },
  discountBg: '#FF850A',
  lockBg: '#7c75ff',
  buttonBg: '#6c47ff',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/ae2beea0-190d-11f1-84ad-6b5693b490dc.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/53fb4c40-191d-11f1-84ad-6b5693b490dc.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/721220e0-191e-11f1-84ad-6b5693b490dc.png',
  vipBigIconDeg: 0,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/5d445310-1921-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#F2CA91',
  unlockedToastTextColor: '#F2CA91',
  vipTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor1: '#F2CA91',
  vipSuccessTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessbenefitsTextColor: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.90)',
  vipListBg:
    'linear-gradient(to right, rgba(23, 23, 45, 1), rgba(42, 39, 88, 1))',
  vipStatusBg:
    'linear-gradient(to right, rgba(23, 23, 45, 1), rgba(42, 39, 88, 1)) padding-box, linear-gradient(to right, rgba(255, 245, 218, 0.2), rgba(240, 201, 134, 0)) border-box',
  vipIconGradientFrom: '#F4EDC8',
  vipIconGradientTo: '#F2CA91',
  vipBottomBgColor: 'rgba(43,40,93,1)',
  tryAgainIcon:
    'https://v-mps.crazymaplestudios.com/images/46c2d740-1923-11f1-84ad-6b5693b490dc.png',
  unpublishIcon:
    'https://v-mps.crazymaplestudios.com/images/c0eb1e60-1923-11f1-84ad-6b5693b490dc.png',
  retentionModalBg:
    'https://v-mps.crazymaplestudios.com/images/bec36720-1bba-11f1-84ad-6b5693b490dc.png',
  supportEmail: 'support@b25reel.com',
  vipSuccessBg:
    'radial-gradient(216.88% 100% at 49.84% 0%, #B48543 0%, #644820 8%, #332A1E 18%, #1B1610 28%) padding-box, linear-gradient(#1B1610, #1B1610) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  unlockedToastBg:
    'linear-gradient(to right, #2d2017, #583e27) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  facebookAppId: '1579523770202035',
  appleClientId: 'com.b25.b25reel.applesignin',
  firebase: {
    apiKey: 'AIzaSyCwrjmoV9Wy2unUw-ZkhRcW8z4AL7gnQYI',
    authDomain: 'b25reel.firebaseapp.com',
    projectId: 'b25reel',
    storageBucket: 'b25reel.firebasestorage.app',
    messagingSenderId: '697277545086',
    appId: '1:697277545086:web:3068b686507f88714bf62f',
    measurementId: 'G-F2H1Z1SHXT',
  },
  adyen: createAdyenConfig('live', ADYEN_CONFIG.b25.live),
  pwaBorderColor: '1px solid rgba(0, 0, 0, 0.1)',
  aliPlayer: { licenseDomain: 'b25reel.com' },
}

const TEST_B25SHORT_CONFIG: SiteConfig = {
  ...B25SHORT_CONFIG,
  channelId: CHANNEL_IDS.b25Short.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.b25.test),
  aliPlayer: { licenseDomain: 'b25reel.com' },
}

const B25BINGE_CONFIG: SiteConfig = {
  ...B25SHORT_CONFIG,
  title: 'B25Binge',
  description: 'B25Binge',
  metadataBase: 'https://binge.b25reel.com',
  channelId: CHANNEL_IDS.b25Binge.web,
  favicon:
    'https://v-mps.crazymaplestudios.com/images/bacfa3d0-4a82-11f1-acb2-c14bef828c82.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/424f6000-4a85-11f1-acb2-c14bef828c82.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/baf9c110-4a82-11f1-acb2-c14bef828c82.png',
    324: 'https://v-mps.crazymaplestudios.com/images/baedda30-4a82-11f1-acb2-c14bef828c82.png',
    220: 'https://v-mps.crazymaplestudios.com/images/bae4d980-4a82-11f1-acb2-c14bef828c82.png',
    192: 'https://v-mps.crazymaplestudios.com/images/baceb970-4a82-11f1-acb2-c14bef828c82.png',
    180: 'https://v-mps.crazymaplestudios.com/images/bac36ed0-4a82-11f1-acb2-c14bef828c82.png',
    167: 'https://v-mps.crazymaplestudios.com/images/bac2ab80-4a82-11f1-acb2-c14bef828c82.png',
    120: 'https://v-mps.crazymaplestudios.com/images/bad52210-4a82-11f1-acb2-c14bef828c82.png',
  },
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/8ece0c10-4a85-11f1-acb2-c14bef828c82.png',
  theme: {
    primary: '13 86% 49%',
  },
  discountBg: '#E83F11',
  lockBg: 'linear-gradient(121deg, #FF8400 0%, #F90E9B 100%)',
  buttonBg:
    'linear-gradient(111.22deg, #FF8400 0.82%, #FC6C07 25.72%, #F90E9B 100%)',
  buttonOverlay: {
    background:
      'url(https://v-mps.crazymaplestudios.com/images/268bf2a0-4ac3-11f1-acb2-c14bef828c82.png) 0 0 / cover no-repeat',
    mixBlendMode: 'plus-lighter',
  },
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/29fe6970-6564-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/ad26a900-4aa4-11f1-acb2-c14bef828c82.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/730693c0-4a86-11f1-acb2-c14bef828c82.png',
  vipBigIconDeg: 0,
  vipBigIconHeight: 100,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/5d445310-1921-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#FFFAE8',
  unlockedToastTextColor: '#F2CA91',
  vipTextColor2: 'rgba(255, 250, 232, 0.60)',
  vipBottomTextColor: 'rgba(255, 237, 212, 1)',
  vipIconGradientFrom: '#F4EDC8',
  vipIconGradientTo: '#F2CA91',
  vipBottomBgColor: 'rgba(255, 255, 255, 0.2)',
  vipSuccessTextColor1: '#F2CA91',
  vipSuccessTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessbenefitsTextColor: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.70)',
  vipListBg:
    'radial-gradient(199.05% 156.83% at 35.42% 31.73%, #F3740D 0%, #E42E12 32.56%, #C71DFF 100%)',
  vipStatusBg:
    'radial-gradient(195.78% 147.65% at 25.95% 23.33%, #F3740D 0%, #E42E12 32.56%, #C71DFF 100%) padding-box, linear-gradient(to bottom, transparent, transparent) border-box',
  vipSuccessBg:
    'radial-gradient(ellipse 160% 100% at 50% 0%, rgb(221,81,9) 0%, rgb(178,66,6) 9%, rgb(135,50,4) 19%, rgb(92,35,2) 28%, rgb(49,19,0) 38%) padding-box, linear-gradient(rgb(49,19,0), rgb(49,19,0)) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  vipSuccessToplight:
    'https://v-mps.crazymaplestudios.com/images/d66aa600-4f44-11f1-acb2-c14bef828c82.png',
  unlockedToastBg:
    'linear-gradient(90deg, #311300 0%, #DD5109 90.12%) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
}

const TEST_B25BINGE_CONFIG: SiteConfig = {
  ...B25BINGE_CONFIG,
  channelId: CHANNEL_IDS.b25Binge.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.b25.test),
  aliPlayer: { licenseDomain: 'b25reel.com' },
}

const B25WATCH_CONFIG: SiteConfig = {
  ...B25SHORT_CONFIG,
  title: 'B25Watch',
  description: 'B25Watch',
  metadataBase: 'https://watch.b25reel.com',
  channelId: CHANNEL_IDS.b25Watch.web,
  favicon:
    'https://v-mps.crazymaplestudios.com/images/7bde8d70-4a83-11f1-acb2-c14bef828c82.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/20ccbb30-4a85-11f1-acb2-c14bef828c82.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/7c138020-4a83-11f1-acb2-c14bef828c82.png',
    324: 'https://v-mps.crazymaplestudios.com/images/7c0c2d20-4a83-11f1-acb2-c14bef828c82.png',
    220: 'https://v-mps.crazymaplestudios.com/images/7bfaa0f0-4a83-11f1-acb2-c14bef828c82.png',
    192: 'https://v-mps.crazymaplestudios.com/images/7c0464f0-4a83-11f1-acb2-c14bef828c82.png',
    180: 'https://v-mps.crazymaplestudios.com/images/7bfb8b50-4a83-11f1-acb2-c14bef828c82.png',
    167: 'https://v-mps.crazymaplestudios.com/images/7bf808e0-4a83-11f1-acb2-c14bef828c82.png',
    120: 'https://v-mps.crazymaplestudios.com/images/7bf96870-4a83-11f1-acb2-c14bef828c82.png',
  },
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/20ccbb30-4a85-11f1-acb2-c14bef828c82.png',
  theme: {
    primary: '246 100% 73%',
  },
  buttonBg: {
    background: 'linear-gradient(90deg, #969EFF 0%, #3E1FB2 100%)',
    boxShadow: '0 0 8px 0 rgba(226, 230, 255, 0.50) inset',
  },
  discountBg: '#6D5DFF',
  lockBg: '#7060FF',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/54937180-6564-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/5ca777c0-4aae-11f1-acb2-c14bef828c82.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/a12d7520-4a86-11f1-acb2-c14bef828c82.png',
  vipBigIconDeg: 0,
  vipBigIconHeight: 108,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/5d445310-1921-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#FFFAE8',
  unlockedToastTextColor: '#FFF',
  vipTextColor2: 'rgba(255, 250, 232, 0.7)',
  vipBottomTextColor: '#FFEDD4',
  vipListBg: 'linear-gradient(275deg, #3E1FB2 0%, #7C6EFF 96.5%)',
  vipStatusBg:
    'linear-gradient(275deg, #3E1FB2 0%, #7C6EFF 96.5%) padding-box, linear-gradient(to bottom, transparent, transparent) border-box',
  vipIconGradientFrom: 'rgba(244, 237, 200, 1)',
  vipIconGradientTo: 'rgba(242, 202, 145, 1)',
  vipBottomBgColor: '#3D328C',
  vipSuccessTextColor1: '#F6DDB6',
  vipSuccessTextColor2: 'rgba(246, 221, 182, 0.70)',
  vipSuccessbenefitsTextColor: 'rgba(246, 221, 182, 0.70)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.70)',
  vipSuccessDividerColor: '#F6DDB6',
  vipSuccessBg:
    'radial-gradient(82.06% 35.08% at 50% 0%, rgba(104, 117, 255, 0.80) 0%, rgba(70, 52, 147, 0.80) 50%, rgba(3, 0, 40, 0.80) 100%) padding-box, linear-gradient(to bottom, transparent, transparent) border-box',
  vipSuccessBorder: 'none',
  unlockedToastBg:
    'linear-gradient(90deg, #969EFF 0%, #3E1FB2 100%) padding-box, linear-gradient(to bottom, transparent, transparent) border-box',
  unlockedToastBoxShadow: '0 0 8px 0 rgba(226, 230, 255, 0.50) inset',
}

const TEST_B25WATCH_CONFIG: SiteConfig = {
  ...B25WATCH_CONFIG,
  channelId: CHANNEL_IDS.b25Watch.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.b25.test),
  aliPlayer: { licenseDomain: 'b25reel.com' },
}
const SWEETDRAMA_CONFIG: SiteConfig = {
  title: 'SweetDrama',
  description: 'SweetDrama',
  metadataBase: 'https://drama.sweetmaxbest.com',
  favicon:
    'https://v-mps.crazymaplestudios.com/images/67c6db30-1b5d-11f1-84ad-6b5693b490dc.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/66a37460-1b5e-11f1-84ad-6b5693b490dc.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/67c7c590-1b5d-11f1-84ad-6b5693b490dc.png',
    324: 'https://v-mps.crazymaplestudios.com/images/67b0e230-1b5d-11f1-84ad-6b5693b490dc.png',
    220: 'https://v-mps.crazymaplestudios.com/images/67c861d0-1b5d-11f1-84ad-6b5693b490dc.png',
    192: 'https://v-mps.crazymaplestudios.com/images/67c92520-1b5d-11f1-84ad-6b5693b490dc.png',
    180: 'https://v-mps.crazymaplestudios.com/images/67aebf50-1b5d-11f1-84ad-6b5693b490dc.png',
    167: 'https://v-mps.crazymaplestudios.com/images/67b045f0-1b5d-11f1-84ad-6b5693b490dc.png',
    120: 'https://v-mps.crazymaplestudios.com/images/67af82a0-1b5d-11f1-84ad-6b5693b490dc.png',
  },
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/032b7db0-2743-11f1-84ad-6b5693b490dc.png',
  channelId: CHANNEL_IDS.sweetDrama.web,
  theme: {
    primary: '345, 100%, 65%',
  },
  buttonBg: '#ff4876',
  discountBg: '#F7225E',
  lockBg: '#ff4876',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/73384ac0-6564-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/87447220-1b66-11f1-84ad-6b5693b490dc.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/49a5c1d0-1b66-11f1-84ad-6b5693b490dc.png',
  vipBigIconDeg: 15,
  vipBgMask: '',
  vipTextColor: '#F2CA91',
  unlockedToastTextColor: '#F2CA91',
  vipTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor1: '#F2CA91',
  vipSuccessTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessbenefitsTextColor: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.90)',
  vipListBg: 'linear-gradient(to right, rgba(68,5,27,1), rgba(132,37,64,1))',
  vipStatusBg:
    'linear-gradient(to right, rgba(68,5,27,1), rgba(132,37,64,1)) padding-box, linear-gradient(to right, rgba(242, 202, 145, 0.2), rgba(240, 201, 134, 0)) border-box',
  vipIconGradientFrom: '#F4EDC8',
  vipIconGradientTo: '#F2CA91',
  vipBottomBgColor: 'rgba(68,5,27,1)',
  tryAgainIcon:
    'https://v-mps.crazymaplestudios.com/images/46c2d740-1923-11f1-84ad-6b5693b490dc.png',
  unpublishIcon:
    'https://v-mps.crazymaplestudios.com/images/c0eb1e60-1923-11f1-84ad-6b5693b490dc.png',
  retentionModalBg:
    'https://v-mps.crazymaplestudios.com/images/bec36720-1bba-11f1-84ad-6b5693b490dc.png',
  supportEmail: 'support@sweetmaxbest.com',
  vipSuccessBg:
    'radial-gradient(216.88% 100% at 49.84% 0%, #D4A4A4 0%, #A13951 8%, #6D1633 18%, #45061B 28%) padding-box, linear-gradient(#44051A, #44051A) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  unlockedToastBg:
    'linear-gradient(to right, rgba(68,5,27,1), rgba(132,37,64,1)) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  facebookAppId: '1608695503585799',
  appleClientId: 'com.sweetmaple.sweetmax.applesignin',
  firebase: {
    apiKey: 'AIzaSyDsyDDDHeoiCemiYaEIVUjdUhIsRudH5Es',
    authDomain: 'sweetmax-87cfd.firebaseapp.com',
    projectId: 'sweetmax-87cfd',
    storageBucket: 'sweetmax-87cfd.firebasestorage.app',
    messagingSenderId: '1049184957156',
    appId: '1:1049184957156:web:e2548ca62559edf508b2f1',
    measurementId: 'G-ET690RZK3V',
  },
  adyen: createAdyenConfig('live', ADYEN_CONFIG.sweet.live),
  aliPlayer: { licenseDomain: 'sweetmaxbest.com' },
}
const TEST_SWEETDRAMA_CONFIG: SiteConfig = {
  ...SWEETDRAMA_CONFIG,
  channelId: CHANNEL_IDS.sweetDrama.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.sweet.test),
  aliPlayer: { licenseDomain: 'sweetmaxbest.com' },
}
const SWEETSHORT_CONFIG: SiteConfig = {
  title: 'SweetShort',
  description: 'SweetShort',
  metadataBase: 'https://short.sweetmaxbest.com',
  favicon:
    'https://v-mps.crazymaplestudios.com/images/6191fcb0-2100-11f1-84ad-6b5693b490dc.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/8a400730-20fe-11f1-84ad-6b5693b490dc.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/61c58fd0-2100-11f1-84ad-6b5693b490dc.png',
    324: 'https://v-mps.crazymaplestudios.com/images/61be15c0-2100-11f1-84ad-6b5693b490dc.png',
    220: 'https://v-mps.crazymaplestudios.com/images/61b05a20-2100-11f1-84ad-6b5693b490dc.png',
    192: 'https://v-mps.crazymaplestudios.com/images/61aefa90-2100-11f1-84ad-6b5693b490dc.png',
    180: 'https://v-mps.crazymaplestudios.com/images/61938350-2100-11f1-84ad-6b5693b490dc.png',
    167: 'https://v-mps.crazymaplestudios.com/images/61ade920-2100-11f1-84ad-6b5693b490dc.png',
    120: 'https://v-mps.crazymaplestudios.com/images/61877560-2100-11f1-84ad-6b5693b490dc.png',
  },
  channelId: CHANNEL_IDS.sweetShort.web,
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/7c83fc40-2744-11f1-84ad-6b5693b490dc.png',
  theme: {
    primary: '15, 93%, 55%',
  },
  lockBg: '#f75722',
  discountBg: 'linear-gradient(90deg, #FF8E1C 0%, #FF8E1C 100%)',
  buttonBg: 'radial-gradient(50% 50% at 50% 100%, #FECA8E 0%, #FF8E1C 100%)',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/a106abe0-6564-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/2e7443f0-1b93-11f1-84ad-6b5693b490dc.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/fd206590-1b92-11f1-84ad-6b5693b490dc.png',
  vipBigIconDeg: 15,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/5d445310-1921-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#F2CA91',
  unlockedToastTextColor: '#F2CA91',
  vipTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor1: '#F2CA91',
  vipSuccessTextColor2: 'rgba(242, 202, 145, 0.70)',
  vipSuccessbenefitsTextColor: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.90)',
  vipIconGradientFrom: '#F4EDC8',
  vipIconGradientTo: '#F2CA91',
  vipBottomBgColor: 'rgba(88, 62, 39, 1)',
  tryAgainIcon:
    'https://v-mps.crazymaplestudios.com/images/46c2d740-1923-11f1-84ad-6b5693b490dc.png',
  unpublishIcon:
    'https://v-mps.crazymaplestudios.com/images/c0eb1e60-1923-11f1-84ad-6b5693b490dc.png',
  retentionModalBg:
    'https://v-mps.crazymaplestudios.com/images/bec36720-1bba-11f1-84ad-6b5693b490dc.png',
  vipListBg:
    'linear-gradient(to right, rgba(45, 32, 23, 1), rgba(88, 62, 39, 1))',
  vipStatusBg:
    'linear-gradient(to right, rgba(45, 32, 23, 1), rgba(88, 62, 39, 1)) padding-box, linear-gradient(to bottom, rgba(240, 201, 134, 0.2), rgba(255, 245, 218, 0.2)) border-box',
  vipSuccessBg:
    'radial-gradient(216.88% 100% at 49.84% 0%, #B48543 0%, #644820 8%, #332A1E 18%, #1B1610 28%) padding-box, linear-gradient(#1F1610, #1F1610) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  unlockedToastBg:
    'linear-gradient(to right, rgba(45, 32, 23, 1), rgba(88, 62, 39, 1)) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #F2CA91 5%, rgba(40, 36, 15, 0) 100%) border-box',
  supportEmail: 'support@sweetmaxbest.com',
  facebookAppId: '1608695503585799',
  appleClientId: 'com.sweetmaple.sweetmax.applesignin',
  firebase: {
    apiKey: 'AIzaSyDsyDDDHeoiCemiYaEIVUjdUhIsRudH5Es',
    authDomain: 'sweetmax-87cfd.firebaseapp.com',
    projectId: 'sweetmax-87cfd',
    storageBucket: 'sweetmax-87cfd.firebasestorage.app',
    messagingSenderId: '1049184957156',
    appId: '1:1049184957156:web:e2548ca62559edf508b2f1',
    measurementId: 'G-ET690RZK3V',
  },
  adyen: createAdyenConfig('live', ADYEN_CONFIG.sweet.live),
  aliPlayer: { licenseDomain: 'sweetmaxbest.com' },
}

const TEST_SWEETSHORT_CONFIG: SiteConfig = {
  ...SWEETSHORT_CONFIG,
  channelId: CHANNEL_IDS.sweetShort.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.sweet.test),
  aliPlayer: { licenseDomain: 'sweetmaxbest.com' },
}

const SWEETBINGE_CONFIG: SiteConfig = {
  ...SWEETSHORT_CONFIG,
  title: 'SweetBinge',
  description: 'SweetBinge',
  metadataBase: 'https://binge.sweetmaxbest.com',
  channelId: CHANNEL_IDS.sweetBinge.web,
  favicon:
    'https://v-mps.crazymaplestudios.com/images/f8c2c040-4a83-11f1-acb2-c14bef828c82.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/33f7f530-4a85-11f1-acb2-c14bef828c82.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/f8fcbc00-4a83-11f1-acb2-c14bef828c82.png',
    324: 'https://v-mps.crazymaplestudios.com/images/f8fbd1a0-4a83-11f1-acb2-c14bef828c82.png',
    220: 'https://v-mps.crazymaplestudios.com/images/f8eae1b0-4a83-11f1-acb2-c14bef828c82.png',
    192: 'https://v-mps.crazymaplestudios.com/images/f8e9a930-4a83-11f1-acb2-c14bef828c82.png',
    180: 'https://v-mps.crazymaplestudios.com/images/f8d9a3a0-4a83-11f1-acb2-c14bef828c82.png',
    167: 'https://v-mps.crazymaplestudios.com/images/f8d89230-4a83-11f1-acb2-c14bef828c82.png',
    120: 'https://v-mps.crazymaplestudios.com/images/f8d759b0-4a83-11f1-acb2-c14bef828c82.png',
  },
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/a596df30-4a85-11f1-acb2-c14bef828c82.png',
  theme: {
    primary: '312 100% 67%',
  },
  buttonBg:
    'linear-gradient(94deg, #FF50FC 27.36%, #FB4176 71.57%, #FC6161 90.6%)',
  discountBg:
    'linear-gradient(95deg, #FE50FC 3.72%, #FB4178 76.74%, #FC6161 107.31%)',
  lockBg: '#FF56DE',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/b4f499a0-6564-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/1858f930-4f78-11f1-acb2-c14bef828c82.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/d536af80-4a86-11f1-acb2-c14bef828c82.png',
  vipBigIconDeg: 7.378,
  vipBigIconHeight: 88,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/5d445310-1921-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#FDDEFF',
  unlockedToastTextColor: '#FDDEFF',
  vipTextColor2: 'rgba(252, 209, 255, 0.60)',
  vipBottomTextColor: 'rgba(253, 222, 255, 1)',
  vipSuccessTextColor1: '#FDDEFF',
  vipSuccessTextColor2: 'rgba(253, 222, 255, 0.70)',
  vipSuccessbenefitsTextColor: 'rgba(242, 202, 145, 0.70)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.70)',
  vipSuccessDividerColor: {
    diamond: '#BA3FEF',
    start: '#F291E5',
    center: '#E091F2',
    end: '#F091F2',
  },
  vipListBg: 'linear-gradient(90deg, #5B0062 0%, #74007C 21.67%, #CB1E8E 100%)',
  vipStatusBg:
    'linear-gradient(90deg, #5B0062 0%, #74007C 21.67%, #CB1E8E 100%) padding-box, linear-gradient(to bottom, transparent, transparent) border-box',
  vipIconGradientFrom: 'rgba(243, 216, 255, 1)',
  vipIconGradientTo: 'rgba(226, 129, 255, 1)',
  vipBottomBgColor: '#8C1582',
  vipSuccessBg:
    'linear-gradient(180deg, #AA1B6A 0%, #66106A 17.7%, #2F0328 44.52%) padding-box, linear-gradient(180deg, #FFFFFF 0%, #FF75DA 6%, rgba(40, 36, 15, 0) 100%) border-box',
  unlockedToastBg:
    'linear-gradient(90deg, #5D0064 9.88%, #CB1D8E 100%) padding-box, linear-gradient(to bottom, #FFFFFF 0%, #FFB9F9 5%, rgba(255, 82, 241, 0) 100%) border-box',
}

const TEST_SWEETBINGE_CONFIG: SiteConfig = {
  ...SWEETBINGE_CONFIG,
  channelId: CHANNEL_IDS.sweetBinge.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.sweet.test),
  aliPlayer: { licenseDomain: 'sweetmaxbest.com' },
}

const SWEETWATCH_CONFIG: SiteConfig = {
  ...SWEETSHORT_CONFIG,
  title: 'SweetWatch',
  description: 'SweetWatch',
  metadataBase: 'https://watch.sweetmaxbest.com',
  channelId: CHANNEL_IDS.sweetWatch.web,
  favicon:
    'https://v-mps.crazymaplestudios.com/images/3f494160-4a84-11f1-acb2-c14bef828c82.png',
  headerLogo:
    'https://v-mps.crazymaplestudios.com/images/07e0be20-4f60-11f1-acb2-c14bef828c82.png',
  appleTouchIcon: {
    512: 'https://v-mps.crazymaplestudios.com/images/3fa65580-4a84-11f1-acb2-c14bef828c82.png',
    324: 'https://v-mps.crazymaplestudios.com/images/3f967700-4a84-11f1-acb2-c14bef828c82.png',
    220: 'https://v-mps.crazymaplestudios.com/images/3f8a6910-4a84-11f1-acb2-c14bef828c82.png',
    192: 'https://v-mps.crazymaplestudios.com/images/3f6cf600-4a84-11f1-acb2-c14bef828c82.png',
    180: 'https://v-mps.crazymaplestudios.com/images/3f80cc20-4a84-11f1-acb2-c14bef828c82.png',
    167: 'https://v-mps.crazymaplestudios.com/images/3f6a8500-4a84-11f1-acb2-c14bef828c82.png',
    120: 'https://v-mps.crazymaplestudios.com/images/3f5883a0-4a84-11f1-acb2-c14bef828c82.png',
  },
  siteNameIcon:
    'https://v-mps.crazymaplestudios.com/images/07dffad0-4f60-11f1-acb2-c14bef828c82.png',
  theme: {
    primary: '13 86% 49%',
  },
  buttonBg: {
    background:
      'linear-gradient(266deg, #EF2020 1.18%, #FF6183 26.51%, #D3181F 100%)',
    boxShadow: '0 0 6.4px 0 rgba(255, 255, 255, 0.80) inset',
  },
  discountBg: '#C9161D',
  lockBg: '#C9161D',
  coinIcon:
    'https://v-mps.crazymaplestudios.com/images/c6378ba0-6564-11f1-96ad-b3be8c391a9d.png',
  vipIcon:
    'https://v-mps.crazymaplestudios.com/images/8d53f290-4aae-11f1-acb2-c14bef828c82.png',
  vipBigIcon:
    'https://v-mps.crazymaplestudios.com/images/1e456220-4a87-11f1-acb2-c14bef828c82.png',
  vipBigIconDeg: 0,
  vipBigIconHeight: 90,
  vipBgMask:
    'https://v-mps.crazymaplestudios.com/images/5d445310-1921-11f1-84ad-6b5693b490dc.png',
  vipTextColor: '#F2CA91',
  unlockedToastTextColor: '#6D0D17',
  vipTextColor2: 'rgba(242, 202, 145, 0.7)',
  vipBottomTextColor: '#FFEDD4',
  vipSuccessTextColor1: 'rgba(246, 221, 182, 1)',
  vipSuccessTextColor2: 'rgba(246, 221, 182, 0.7)',
  vipSuccessbenefitsTextColor: 'rgba(246, 221, 182, 0.7)',
  vipSuccessTextColor3: 'rgba(242, 202, 145, 0.7)',
  vipSuccessDividerColor: '#F6DDB6',
  vipListBg: 'linear-gradient(90deg, #180000 9.88%, #741515 100%)',
  vipStatusBg:
    'linear-gradient(90deg, #180000 9.88%, #741515 100%) padding-box, linear-gradient(to right, rgba(242, 202, 145, 0.2), rgba(45, 38, 27, 0)) border-box',
  vipIconGradientFrom: 'rgba(244, 237, 200, 1)',
  vipIconGradientTo: 'rgba(242, 202, 145, 1)',
  vipBottomBgColor: '#510000',
  vipSuccessBorder: 'none',
  vipSuccessBg:
    'radial-gradient(56.1% 23.98% at 50% 0%, rgba(255, 52, 52, 0.64) 0%, rgba(153, 31, 31, 0.00) 100%), linear-gradient(0deg, #180000 0%, #180000 100%), linear-gradient(180deg, #FFDDC0 0%, #E22B53 16.84%, #2E0001 88.9%)',
  unlockedToastBg: '#F7B1D1',
  unlockedToastBoxShadow: '0 0 6.4px 0 rgba(255, 255, 255, 0.80) inset',
}

const TEST_SWEETWATCH_CONFIG: SiteConfig = {
  ...SWEETWATCH_CONFIG,
  channelId: CHANNEL_IDS.sweetWatch.test,
  adyen: createAdyenConfig('test', ADYEN_CONFIG.sweet.test),
  aliPlayer: { licenseDomain: 'sweetmaxbest.com' },
}

export const SITE_CONFIGS: Record<string, SiteConfig> = {
  // ReelShort
  'test-delivery-drama-web.epubgame.com': TEST_REELSHORT_CONFIG,
  'gray-drama.reelshort.com': {
    ...REELSHORT_CONFIG,
    channelId: CHANNEL_IDS.reelShort.gray,
  },
  'drama.reelshort.com': REELSHORT_CONFIG,

  // B25Drama
  'test-drama.b25reel.com': TEST_B25DRAMA_CONFIG,
  'gray-drama.b25reel.com': {
    ...B25DRAMA_CONFIG,
    channelId: CHANNEL_IDS.b25Drama.gray,
  },
  'drama.b25reel.com': B25DRAMA_CONFIG,
  'www.b25reel.com': B25DRAMA_CONFIG,

  // B25Short
  'test-short.b25reel.com': TEST_B25SHORT_CONFIG,
  'gray-short.b25reel.com': {
    ...B25SHORT_CONFIG,
    channelId: CHANNEL_IDS.b25Short.gray,
  },
  'short.b25reel.com': B25SHORT_CONFIG,

  // B25Binge
  'test-binge.b25reel.com': TEST_B25BINGE_CONFIG,
  'gray-binge.b25reel.com': {
    ...B25BINGE_CONFIG,
    channelId: CHANNEL_IDS.b25Binge.gray,
  },
  'binge.b25reel.com': B25BINGE_CONFIG,

  // B25Watch
  'test-watch.b25reel.com': TEST_B25WATCH_CONFIG,
  'gray-watch.b25reel.com': {
    ...B25WATCH_CONFIG,
    channelId: CHANNEL_IDS.b25Watch.gray,
  },
  'watch.b25reel.com': B25WATCH_CONFIG,

  // SweetDrama
  'test-drama.sweetmaxbest.com': TEST_SWEETDRAMA_CONFIG,
  'gray-drama.sweetmaxbest.com': {
    ...SWEETDRAMA_CONFIG,
    channelId: CHANNEL_IDS.sweetDrama.gray,
  },

  'drama.sweetmaxbest.com': SWEETDRAMA_CONFIG,
  'www.sweetmaxbest.com': SWEETDRAMA_CONFIG,

  // SweetShort
  'test-short.sweetmaxbest.com': TEST_SWEETSHORT_CONFIG,
  'gray-short.sweetmaxbest.com': {
    ...SWEETSHORT_CONFIG,
    channelId: CHANNEL_IDS.sweetShort.gray,
  },

  'short.sweetmaxbest.com': {
    ...SWEETSHORT_CONFIG,
  },

  // SweetBinge
  'test-binge.sweetmaxbest.com': TEST_SWEETBINGE_CONFIG,
  'gray-binge.sweetmaxbest.com': {
    ...SWEETBINGE_CONFIG,
    channelId: CHANNEL_IDS.sweetBinge.gray,
  },
  'binge.sweetmaxbest.com': SWEETBINGE_CONFIG,

  // SweetWatch
  'test-watch.sweetmaxbest.com': TEST_SWEETWATCH_CONFIG,
  'gray-watch.sweetmaxbest.com': {
    ...SWEETWATCH_CONFIG,
    channelId: CHANNEL_IDS.sweetWatch.gray,
  },
  'watch.sweetmaxbest.com': SWEETWATCH_CONFIG,

  localhost: {
    // ...TEST_SWEETWATCH_CONFIG,
    ...TEST_REELSHORT_CONFIG,
  },
  '172.30.1.2': {
    ...SWEETBINGE_CONFIG,
  },
  '172.30.0.177': {
    ...TEST_B25DRAMA_CONFIG,
  },
}

export function getSiteConfigByHostname(hostname: string) {
  //   console.log('getSiteConfigByHostname hostname', hostname)
  return SITE_CONFIGS[hostname]
}

/**
 * Get site configuration on client side.
 */
export function getSiteConfigClient(): SiteConfig | null {
  if (typeof window === 'undefined') {
    return null
  }
  const hostname = window.location.hostname
  // console.log('getSiteConfigClient hostname', hostname);
  return getSiteConfigByHostname(hostname)
}

export function isReelshort(): boolean {
  const config = getSiteConfigClient()
  return config?.title === 'ReelShort'
}
