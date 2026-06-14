'use client'
import { ReportSDK } from '@cmsfe/tools'
import {
  getSessionStorage,
  removeSessionStorage,
  setSessionStorage,
} from './storageUtils'
import { getH5mode } from '@/lib/utils'
import { getSiteConfigClient } from '@/lib/config/site'
import { languageKey } from './constant'

const lang =
  typeof window !== 'undefined'
    ? localStorage.getItem(languageKey) || window[languageKey]
    : ''

let h5mode: string = ''
let packageName: string = ''
if (typeof window !== 'undefined') {
  const mode = getH5mode()
  h5mode = mode === 'vip' ? '2' : mode === 'iap' ? '1' : '0'
  packageName = window.variantPlayer === 'ali' ? 'h5_ali' : 'h5'
}

const reportSDK = ReportSDK.getInstance({
  reportAPI: `${process.env.NEXT_PUBLIC_API_LOG_DOMAIN}`,
  version: '1.0.01',
  channelId: getSiteConfigClient()?.channelId || '',
  appId: 'cm1017',
  lang: lang || 'en',
  packageName,
  properties: {
    is_iap: h5mode,
  },
  onSuccess: (data) => {
    const { _event_name, _sub_event_name, properties } = data

    console.debug(
      `%c report: ${_sub_event_name || _event_name} ${properties?._action || ''}`,
      'font-size:13px; background:pink; color:#bf2c9f;',
      JSON.stringify(data, null, 2)
    )
  },
})

/** 触发上报缓存 */
export const emitReportCacheHandle = () => {
  const arr = JSON.parse(getSessionStorage('report_cache') || '[]')
  // console.log(
  //   "%c [ 触发缓存上报 ]-12",
  //   "font-size:13px; background:pink; color:#bf2c9f;",
  //   arr,
  // );
  if (Array.isArray(arr)) {
    arr.forEach((item) => {
      reportSDK.eventReport(item)
    })
  }
  removeSessionStorage('report_cache')
}

/** 缓存上报 */
export const reportCacheHandle = (data: any) => {
  const arr = JSON.parse(getSessionStorage('report_cache') || '[]')
  console.log(
    '%c [ 缓存上报信息 ]-12',
    'font-size:13px; background:pink; color:#bf2c9f;',
    JSON.stringify(data, null, 2)
  )

  // 登录注册上报(存储在session中)
  setSessionStorage(
    'report_cache',
    JSON.stringify([
      ...arr,
      {
        ...data,
        ctime: Math.floor(new Date().getTime() / 1000),
      },
    ])
  )
}

export { reportSDK }
