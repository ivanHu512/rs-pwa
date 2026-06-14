import 'server-only'

import { aesDescryptResponse, createSign } from '@cmsfe/tools/service'
import { cookies } from 'next/headers'

import { API_VERSION, CHANNEL_ID, CLIENT_VER } from '../constant'
import { verifyReptile } from '../utils'

function parseResponseText<T>(responseText: string): T {
  try {
    const json = JSON.parse(responseText)
    if (typeof json === 'object' && json) {
      return json
    }
  } catch {}

  return aesDescryptResponse(responseText)
}

export async function createServerH5RequestParams<T>(
  url: string,
  data: Record<string, any> = {},
  params: {
    locale: string
    headers: Headers
    channelId?: string
  }
): Promise<T> {
  const { locale, headers: headersStore, channelId } = params
  try {
    const cookieStore = await cookies()

    const uid = cookieStore.get('uid')?.value || 0
    const session = cookieStore.get('session')?.value || ''
    const devId =
      cookieStore.get('devId')?.value || '78c9dc4a-1b9b-4454-ab13-c5781eea401e'
    console.log(`uid${uid}--headersStore`, JSON.stringify(headersStore))
    // 获取客户端真实 IP 相关 header
    const xForwardedFor = headersStore.get('x-forwarded-for') || ''
    const xRealIp = headersStore.get('x-real-ip') || ''

    const header: any = {
      channelId,
      apiVersion: API_VERSION,
      lang: locale,
      clientVer: CLIENT_VER,
      ts: Math.floor(Date.now() / 1000),
      uid: Number(uid),
      session,
      devId,
      'h5-platform': 1,
    }
    const sign = createSign({
      ...header,
      ...data,
    })

    const finalHeaders: Record<string, any> = {
      timeout: 5000 as any,
      'Content-Type': 'application/json',
      ...header,
      sign,
    }

    // 如果有对应的 IP header，则透传给后端
    if (xForwardedFor) {
      finalHeaders['X-Forwarded-For'] = xForwardedFor
    }
    if (xRealIp) {
      finalHeaders['X-Real-IP'] = xRealIp
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: finalHeaders,
      body: JSON.stringify(data),
      next: {
        revalidate: 0,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    const responseText = await response.text()
    return parseResponseText(responseText)
  } catch (error) {
    // 错误处理
    console.error('Fetch error:', error)
    throw error
  }
}

/** 接口缓存120s */
export async function createServerH5PageRequestParams<T>(
  url: string,
  data: Record<string, any> = {},
  locale: string,
  channelId?: string,
  userAgent?: string
): Promise<T> {
  try {
    const cookieStore = await cookies()
    const isReptile = verifyReptile(userAgent)
    const uid = cookieStore.get('uid')?.value || 0
    const session = cookieStore.get('session')?.value || ''
    const devId =
      cookieStore.get('devId')?.value || '78c9dc4a-1b9b-4454-ab13-c5781eea401e'
    const header: any = {
      channelId: channelId || CHANNEL_ID,
      apiVersion: API_VERSION,
      lang: locale,
      clientVer: CLIENT_VER,
      ts: 1758250327,
      uid: Number(uid),
      session: session,
      devId: devId,
      'h5-platform': 1,
    }

    // const sign = createSign({
    //   ...header,
    //   ...data,
    // })

    const finalHeaders: Record<string, any> = {
      timeout: 5000 as any,
      'Content-Type': 'application/json',
      ...header,
      // sign,
    }
    const response = await fetch(url, {
      method: 'POST',
      headers: finalHeaders,
      body: JSON.stringify(data),
      next: {
        revalidate: isReptile || uid == 0 ? 600 : 0,
      },
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    /** 收集高并发下，解析时长 */
    const start = performance.now()
    const responseText = await response.text()
    console.info(
      JSON.stringify({
        name: 'parseTime',
        duration: Math.round((performance.now() - start) * 10) / 10,
        channelId: CHANNEL_ID,
        apiVersion: API_VERSION,
        lang: locale,
        clientVer: CLIENT_VER,
      })
    )

    return parseResponseText(responseText)
  } catch (error) {
    // 错误处理
    console.error('Fetch error:', error)
    throw error
  }
}
