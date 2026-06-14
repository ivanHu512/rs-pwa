import { IProduct, OrderInfo, PayerMax } from '@/types'
import { getEnv } from '@cmsfe/tools/env'
import {
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from '@/lib/storageUtils'

import { getSiteConfigClient } from '@/lib/config/site'
const siteConfig = getSiteConfigClient()

// 是否主站
const isReelShort = ['TEST42003', 'GRAY42003', 'WEB42003'].includes(
  siteConfig?.channelId || ''
)

const CACHE_KEY = '__h5_drama_orderInfo'

export const PAY_CHANNEL = ['paypal', 'adyen']
export const PAY_CHANNEL_ID: Record<
  'ADYEN' | 'PAYPAL' | 'PAGBRASIL' | 'RUS' | 'PAYERMAX',
  string
> = {
  ADYEN: '9001',
  PAYPAL: '3001',
  PAGBRASIL: '8001',
  RUS: '7001',
  PAYERMAX: '6001',
}

// 上报的渠道还和接口下发的渠道号不一样
// 已经不用统一改成后端下发的渠道号
export const REPORT_PAY_CHANNEL: any = {
  [PAY_CHANNEL_ID.ADYEN]: 1004,
  [PAY_CHANNEL_ID.PAYPAL]: 1002,
  [PAY_CHANNEL_ID.PAGBRASIL]: 1007,
  [PAY_CHANNEL_ID.RUS]: 7001,
  [PAY_CHANNEL_ID.PAYERMAX]: 6001,
}

const base_methords = ['applepay', 'card', 'paypal', 'googlepay']

// 根据国家排序支付方式，default 为兜底排序
export const PAYMENT_ORDER: Record<string, any> = {
  default: {
    iap: [...base_methords, 'PAYERMAX_QUICK_PAY'],
    vip: [...base_methords, 'PAYERMAX_QUICK_PAY'],
  },
  ar: {
    iap: [
      'PAYERMAX_BANK_TRANSFER_BANKTRANSFER',
      'applepay',
      'PAYERMAX_APPLEPAY',
      'PAYERMAX_OTC_RAPIPAGO',
      'card',
      'PAYERMAX_CARD',
      'paypal',
      'googlepay',
      'PAYERMAX_GOOGLEPAY',
      'PAYERMAX_QUICK_PAY',
    ],
    vip: [
      'PAYERMAX_BANK_TRANSFER_BANKTRANSFER',
      'applepay',
      'PAYERMAX_APPLEPAY',
      'PAYERMAX_OTC_RAPIPAGO',
      'card',
      'PAYERMAX_CARD',
      'paypal',
      'googlepay',
      'PAYERMAX_GOOGLEPAY',
      'PAYERMAX_QUICK_PAY',
    ],
  },
  jp: {
    iap: [
      'PAYERMAX_WALLET_PAYPAY',
      ...base_methords,
      'PAYERMAX_BANK_TRANSFER_PAYEASY',
      'PAYERMAX_QUICK_PAY',
    ],
    vip: [...base_methords, 'PAYERMAX_QUICK_PAY'],
  },
  br: {
    iap: [
      'PAYERMAX_REALTIME_PAYMENT_PIX',
      'PAYERMAX_WALLET_MERCADOPAGO',
      'PAYERMAX_ONE_TOUCH_MERCADOPAGO',
      'PAYERMAX_CARD',
      'applepay',
      'PAYERMAX_APPLEPAY',
      'card',
      'PAYERMAX_BANK_TRANSFER',
      'paypal',
      'googlepay',
      'PAYERMAX_GOOGLEPAY',
      'PAYERMAX_QUICK_PAY',
    ],
    vip: [
      'PAYERMAX_ONE_TOUCH_MERCADOPAGO',
      'PAYERMAX_WALLET_MERCADOPAGO',
      'PAYERMAX_CARD',
      ...base_methords,
      'PAYERMAX_QUICK_PAY',
    ],
  },
  mx: {
    iap: [
      'PAYERMAX_OTC_OXXO',
      'PAYERMAX_BANK_TRANSFER_BANKTRANSFER',
      ...base_methords,
      'PAYERMAX_QUICK_PAY',
    ],
    vip: [...base_methords, 'PAYERMAX_QUICK_PAY'],
  },
  kr: {
    iap: [
      'PAYERMAX_WALLET_NAVERPAY',
      'PAYERMAX_WALLET_KAKAOPAY',
      'applepay',
      'PAYERMAX_APPLEPAY',
      'card',
      'PAYERMAX_CARD',
      'PAYERMAX_WALLET_TOSS',
      'PAYERMAX_WALLET_SAMSUNGPAY',
      'paypal',
      'googlepay',
      'PAYERMAX_GOOGLEPAY',
      'PAYERMAX_QUICK_PAY',
    ],
    vip: [
      'PAYERMAX_ONE_TOUCH_NAVERPAY',
      'PAYERMAX_ONE_TOUCH_KAKAOPAY',
      'applepay',
      'PAYERMAX_APPLEPAY',
      'card',
      'PAYERMAX_CARD',
      'PAYERMAX_ONE_TOUCH_TOSS',
      'paypal',
      'googlepay',
      'PAYERMAX_GOOGLEPAY',
      'PAYERMAX_QUICK_PAY',
    ],
  },
}

export const METHODS_INFO: any = {
  // --- Core Methods ---
  applepay: {
    name: 'Apple Pay',
    channel: PAY_CHANNEL_ID.ADYEN,
    subChannel: 'applepay',

    icon: 'https://v-mps.crazymaplestudios.com/images/4dffd2a0-1c62-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/b6aeb4e0-c3c2-11f0-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81ad2bf0-1d13-11f1-84ad-6b5693b490dc.png',
  },
  googlepay: {
    name: 'Google Pay',
    channel: PAY_CHANNEL_ID.ADYEN,
    subChannel: 'googlepay',

    icon: 'https://v-mps.crazymaplestudios.com/images/150fc930-1c55-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/b63040a0-c3c3-11f0-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81af9cf0-1d13-11f1-84ad-6b5693b490dc.png',
  },
  card: {
    name: 'Credit Card',
    channel: PAY_CHANNEL_ID.ADYEN,
    icon: 'https://v-mps.crazymaplestudios.com/images/85c2a360-1df3-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/f1b89410-c3c3-11f0-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81c8f150-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#E52E2E',
    text: '#FFFFFF',
  },
  paypal: {
    name: 'PayPal',
    channel: PAY_CHANNEL_ID.PAYPAL,
    icon: 'https://v-mps.crazymaplestudios.com/images/1510daa0-1c55-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/2781f500-c3c4-11f0-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81d79750-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#FFC43A',
  },

  // --- PayerMax Methods ---

  PAYERMAX_APPLEPAY: {
    name: 'Apple Pay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'APPLEPAY',
    methodType: 'APPLEPAY',
    targetOrg: '',
    icon: 'https://v-mps.crazymaplestudios.com/images/4dffd2a0-1c62-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/b6aeb4e0-c3c2-11f0-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81ad2bf0-1d13-11f1-84ad-6b5693b490dc.png',
  },

  PAYERMAX_GOOGLEPAY: {
    name: 'Google Pay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'GOOGLEPAY',
    methodType: 'GOOGLEPAY',
    targetOrg: '',
    icon: 'https://v-mps.crazymaplestudios.com/images/150fc930-1c55-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/b63040a0-c3c3-11f0-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81af9cf0-1d13-11f1-84ad-6b5693b490dc.png',
  },

  PAYERMAX_QUICK_PAY: {
    name: 'checkout.quick-pay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'QUICK_PAY',
    methodType: '',
    targetOrg: '',
    icon: 'https://v-mps.crazymaplestudios.com/images/10c5fb60-1d22-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/fbc48870-1dea-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81c8f150-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#E52E2E',
    text: '#FFFFFF',
  },
  PAYERMAX_CARD: {
    name: 'checkout.local-card-pay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'CARD',
    methodType: 'CARD',
    targetOrg: '',
    icon: 'https://v-mps.crazymaplestudios.com/images/ca6da570-1d3d-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/f1b89410-c3c3-11f0-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81c8f150-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#E52E2E',
    text: '#FFFFFF',
  },

  // Wallets
  PAYERMAX_WALLET_NAVERPAY: {
    name: 'NaverPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'WALLET_NAVERPAY',
    methodType: 'WALLET',
    targetOrg: 'NAVERPAY',
    icon: 'https://v-mps.crazymaplestudios.com/images/09afe8f0-1c54-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/46b2b1d0-1ddd-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81b23500-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#00C730',
    text: '#000000',
  },
  PAYERMAX_WALLET_KAKAOPAY: {
    name: 'KakaoPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'WALLET_KAKAOPAY',
    methodType: 'WALLET',
    targetOrg: 'KAKAOPAY',
    icon: 'https://v-mps.crazymaplestudios.com/images/975e8260-1c54-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/d52f2290-1ddd-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81ae1650-1d13-11f1-84ad-6b5693b490dc.png',
  },
  PAYERMAX_WALLET_TOSS: {
    name: 'TossPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'WALLET_TOSS',
    methodType: 'WALLET',
    targetOrg: 'TOSS',
    icon: 'https://v-mps.crazymaplestudios.com/images/bcc8c1a0-1c54-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/d5305b10-1ddd-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81cc9ad0-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#0064FF',
    text: '#FFFFFF',
  },
  PAYERMAX_WALLET_SAMSUNGPAY: {
    name: 'SamsungPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'WALLET_SAMSUNGPAY',
    methodType: 'WALLET',
    targetOrg: 'SAMSUNGPAY',
    icon: 'https://v-mps.crazymaplestudios.com/images/ccec60f0-1c54-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81d8a8c0-1d13-11f1-84ad-6b5693b490dc.png',
  },
  PAYERMAX_WALLET_PAYPAY: {
    name: 'PayPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'WALLET_PAYPAY',
    methodType: 'WALLET',
    targetOrg: 'PAYPAY',
    icon: 'https://v-mps.crazymaplestudios.com/images/7db84710-1d3f-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81cdd350-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#E52E2E',
    text: '#FFFFFF',
  },

  // One Touch
  PAYERMAX_ONE_TOUCH_NAVERPAY: {
    name: 'NaverPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'ONE_TOUCH_NAVERPAY',
    methodType: 'ONE_TOUCH',
    targetOrg: 'NAVERPAY',
    icon: 'https://v-mps.crazymaplestudios.com/images/09afe8f0-1c54-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/46b2b1d0-1ddd-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81b23500-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#00C730',
  },
  PAYERMAX_ONE_TOUCH_KAKAOPAY: {
    name: 'KakaoPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'ONE_TOUCH_KAKAOPAY',
    methodType: 'ONE_TOUCH',
    targetOrg: 'KAKAOPAY',
    icon: 'https://v-mps.crazymaplestudios.com/images/975e8260-1c54-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/d52f2290-1ddd-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81ae1650-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#FFEB00',
  },
  PAYERMAX_ONE_TOUCH_TOSS: {
    name: 'TossPay',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'ONE_TOUCH_TOSS',
    methodType: 'ONE_TOUCH',
    targetOrg: 'TOSS',
    icon: 'https://v-mps.crazymaplestudios.com/images/bcc8c1a0-1c54-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/d5305b10-1ddd-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81cc9ad0-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#0064FF',
    text: '#FFFFFF',
  },
  PAYERMAX_WALLET_MERCADOPAGO: {
    name: 'MercadoPago',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'WALLET_MERCADOPAGO',
    methodType: 'WALLET',
    targetOrg: 'MERCADOPAGO',
    icon: 'https://v-mps.crazymaplestudios.com/images/78b11dc0-1d3d-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/95c580d0-1dde-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81bd0a70-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#00BCFF',
    text: '#FFFFFF',
  },

  PAYERMAX_ONE_TOUCH_MERCADOPAGO: {
    name: 'MercadoPago',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'ONE_TOUCH_MERCADOPAGO',
    methodType: 'ONE_TOUCH',
    targetOrg: 'MERCADOPAGO',
    icon: 'https://v-mps.crazymaplestudios.com/images/78b11dc0-1d3d-11f1-84ad-6b5693b490dc.png',
    icon2:
      'https://v-mps.crazymaplestudios.com/images/95c580d0-1dde-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81bd0a70-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#00BCFF',
    text: '#FFFFFF',
  },

  PAYERMAX_REALTIME_PAYMENT_PIX: {
    name: 'Pix',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'REALTIME_PAYMENT_PIX',
    methodType: 'REALTIME_PAYMENT',
    targetOrg: 'PIX',
    icon: 'https://v-mps.crazymaplestudios.com/images/c68c7e30-1d3e-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81ca50e0-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#32BCAD',
    text: '#FFFFFF',
  },

  // OTC
  PAYERMAX_OTC_OXXO: {
    name: 'OXXO',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'OTC_OXXO',
    methodType: 'OTC',
    targetOrg: 'OXXO',
    icon: 'https://v-mps.crazymaplestudios.com/images/14359f50-1d25-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81b0d570-1d13-11f1-84ad-6b5693b490dc.png',
  },
  PAYERMAX_OTC_RAPIPAGO: {
    name: 'RapiPago',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'OTC_RAPIPAGO',
    methodType: 'OTC',
    targetOrg: 'RAPIPAGO',
    icon: 'https://v-mps.crazymaplestudios.com/images/29801100-1d3f-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81cb8960-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#E52E2E',
    text: '#FFFFFF',
  },

  // Bank Transfer
  PAYERMAX_BANK_TRANSFER_BANKTRANSFER: {
    name: 'checkout.bank-transfer',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'BANK_TRANSFER_BANKTRANSFER',
    methodType: 'BANK_TRANSFER',
    targetOrg: 'BANKTRANSFER',
    icon: 'https://v-mps.crazymaplestudios.com/images/8f51e260-1d30-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81b9af10-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#E52E2E',
    text: '#FFFFFF',
  },
  PAYERMAX_BANK_TRANSFER: {
    name: 'checkout.bank-transfer',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'BANK_TRANSFER',
    methodType: 'BANK_TRANSFER',
    targetOrg: '',
    icon: 'https://v-mps.crazymaplestudios.com/images/8f51e260-1d30-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81b9af10-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#E52E2E',
    text: '#FFFFFF',
  },
  PAYERMAX_BANK_TRANSFER_PAYEASY: {
    name: 'PayEasy',
    channel: PAY_CHANNEL_ID.PAYERMAX,
    subChannel: 'BANK_TRANSFER_PAYEASY',
    methodType: 'BANK_TRANSFER',
    targetOrg: 'PAYEASY',
    icon: 'https://v-mps.crazymaplestudios.com/images/c54e1550-1d3f-11f1-84ad-6b5693b490dc.png',
    payIcon:
      'https://v-mps.crazymaplestudios.com/images/81b36d80-1d13-11f1-84ad-6b5693b490dc.png',
    bg: '#222D7C',
    text: '#FFFFFF',
  },
}

export const CARD_ICON = {
  jcb: 'https://v-mps.crazymaplestudios.com/images/261d2e50-1dec-11f1-84ad-6b5693b490dc.png',
  brlocal:
    'https://v-mps.crazymaplestudios.com/images/ca6da570-1d3d-11f1-84ad-6b5693b490dc.png',
  visa: 'https://v-mps.crazymaplestudios.com/images/85c2a360-1df3-11f1-84ad-6b5693b490dc.png',
  rightIcon:
    'https://v-mps.crazymaplestudios.com/images/260be4b0-1df6-11f1-84ad-6b5693b490dc.png',
  rIcon_jcb:
    'https://v-mps.crazymaplestudios.com/images/8f6c0f20-1df6-11f1-84ad-6b5693b490dc.png',
  rIcon_br:
    'https://v-mps.crazymaplestudios.com/images/8f6b24c0-1df6-11f1-84ad-6b5693b490dc.png',
}

/**
 * 缓存OrderInfo
 */

export function storeOrderInfo(orderData: OrderInfo) {
  try {
    const existingInfo = getOrderInfo() || {}

    const { adyen_result_code, ...other } = orderData
    const adyen_params = adyen_result_code
      ? {
          check_params: JSON.stringify({
            result_code: adyen_result_code,
          }),
        }
      : {}

    setSessionStorage('originUrl', window.location.href)
    setSessionStorage(
      CACHE_KEY,
      JSON.stringify({
        ...existingInfo,
        ...adyen_params,
        ...other,
      })
    )
  } catch (error) {
    console.error('Failed to save order info to session:', error)
  }
}

export function getOrderInfo() {
  try {
    const orderInfo = JSON.parse(getSessionStorage(CACHE_KEY) || 'false')
    return orderInfo
  } catch (error) {
    console.error('Failed to get order info from session:', error)
    return null
  }
}

export function removeOrderInfo() {
  removeSessionStorage(CACHE_KEY)
}

export function getSearchParams(url = ''): Record<string, string> {
  if (typeof window === 'undefined') {
    return {}
  }
  url = url || window.location.href
  const searchParams = new URLSearchParams(new URL(url).search)

  return Object.fromEntries(
    Array.from(searchParams.entries()).map(([key, value]) => [key, value || ''])
  )
}
/** 刷新页面 */
export const resetUrl = () => {
  const url = getSessionStorage('originUrl') || false
  console.log('resetUrl', window.location.href)

  if (url) {
    removeSessionStorage('originUrl')
    window.history.replaceState({}, '', url)
  }
}

/** 是否支付后重定向 */
export function isPayRedirectBack() {
  const {
    token,
    PayerID,
    redirectResult,
    payment_intent,
    subscription_id,
    cancel,
    pag_back,
    rus_back,
    pm_back,
    status,
  } = getSearchParams()

  const isPayPal = token,
    isPayPalCancel = token && cancel,
    isStripe = !!payment_intent,
    isAdyen = !!redirectResult,
    isPagbrasil = !!pag_back,
    isRus = !!rus_back,
    isPayerMax = !!pm_back,
    isPayerMaxClose = !!pm_back && status === 'CLOSED'

  const isPayBack = isPayPal || isStripe || isAdyen || isRus

  return {
    isPayBack,
    isPayPal,
    isStripe,
    isAdyen,
    isPayPalCancel,
    token,
    PayerID,
    redirectResult,
    payment_intent,
    subscription_id,
    isPagbrasil,
    isRus,
    isPayerMax,
    isPayerMaxClose,
  }
}

/** 生成支付方式排序 */
export function getPaymentList(
  payerMaxData: PayerMax | null,
  storeType: 'vip' | 'iap'
): string[] {
  if (!payerMaxData) return []

  console.log('getPaymentList')

  const payermaxMethods = (
    payerMaxData.payermax_pay_methods[storeType] || []
  ).map(({ methodType, targetOrg }) => {
    if (!methodType && !targetOrg) return 'PAYERMAX_QUICK_PAY'
    return `PAYERMAX_${methodType}${targetOrg ? `_${targetOrg}` : ''}`
  })
  // 组合基础支付方式和 PayerMax 支付方式
  const baseMethods = isReelShort
    ? ['applepay', 'card', 'paypal', 'googlepay']
    : ['applepay', 'card', 'googlepay']
  const allMethods = Array.from(new Set([...baseMethods, ...payermaxMethods]))
  const { country } = payerMaxData

  // 获取排序权重
  const sortOrder =
    PAYMENT_ORDER[country]?.[storeType] ?? PAYMENT_ORDER.default[storeType]
  const orderWeight = new Map(sortOrder.map((id: string, i: number) => [id, i]))

  // 执行排序
  const sortMethods = allMethods.sort((a, b) => {
    const weightA = orderWeight.has(a)
      ? (orderWeight.get(a) as number)
      : Infinity
    const weightB = orderWeight.has(b)
      ? (orderWeight.get(b) as number)
      : Infinity
    return weightA - weightB
  })

  const env = getEnv()

  if (env.isAndroid) {
    const androidMethods = sortMethods.map((m) =>
      m === 'applepay' ? 'googlepay' : m
    )
    return Array.from(new Set(androidMethods))
  }

  return sortMethods
}
