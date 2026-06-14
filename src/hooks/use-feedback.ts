'use client'
import { getEnv } from '@cmsfe/tools/env'
import { useCallback } from 'react'

import { getSiteConfigClient } from '@/lib/config/site'
import { CLIENT_VER, localKeyUid } from '@/lib/constant'
import { getLocalStorage } from '@/lib/storageUtils'
import { useDramaStore } from '@/stores/drama-store'
export default function useFeedback() {
  const getFeedbackUrl = useCallback((data = {}) => {
    const { userInfo } = useDramaStore.getState()
    const userId = userInfo.uid
      ? String(userInfo.uid)
      : getLocalStorage(localKeyUid)

    if (!userId || userId === '0') {
      return
    }

    const { uaParser } = getEnv()
    const baseUrl = import.meta.env.VITE_FEEDBACK_URL

    const uid =
      [1, 2, 3, 4].reduce((p) => p + Math.floor(Math.random() * 10), '') +
      userId

    const params: Record<string, string | null | undefined> = {
      appid: 'cm1017',
      channel: getSiteConfigClient()?.channelId,
      language: localStorage.getItem('language'),
      from: 'Purchase Failed',
      devicePlatform: uaParser?.device?.vendor,
      uuid: uid,
      deviceName: uaParser?.browser?.name,
      version: CLIENT_VER,
      did: uid,
      'package-name': 'V',
      ...data,
    }

    const paramsStr = Object.entries(params)
      .map(([key, value]) => {
        // 对键和值进行 URL 编码
        const encodedKey = encodeURIComponent(key)
        const encodedValue = encodeURIComponent(String(value))
        return `${encodedKey}=${encodedValue}`
      })
      .join('&')

    console.log({ url: `${baseUrl}?${paramsStr}` })

    const a = document.createElement('a')
    a.href = `${baseUrl}?${paramsStr}`
    a.target = '_blank'

    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }, [])

  return { getFeedbackUrl }
}
