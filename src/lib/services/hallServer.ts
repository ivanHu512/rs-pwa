import { headers } from 'next/headers'

import { env } from '@/lib/env'
import { HallInfoV4Response } from '@/types/hall'

import { createServerH5RequestParams } from './index'

/**
 * hall
 */
export const getHallFromServer = async (params: {
  locale: string
  headers: Headers
  channelId?: string
}) => {
  const API = `${env.API_DOMAIN}/api/ms/h5hall/infoV4`

  try {
    const res = await createServerH5RequestParams<{
      code: number
      data: HallInfoV4Response
    }>(API, {}, params)

    if (res && res.code === 0) {
      return res.data
    }
    return null
  } catch (error) {
    console.error('getHallFromServer error:', error)
    return null
  }
}
