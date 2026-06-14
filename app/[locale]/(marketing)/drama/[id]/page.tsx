import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

import VideoItems from '@/components/video-items'
import { routing } from '@/i18n/routing'
import { getSiteServerConfig } from '@/lib/config/site-server'
import { localsMap } from '@/lib/constant'
import { getH5BookDetail } from '@/lib/services/home'
import {
  BookPreLoadType,
  ChapterItem,
  ChapterLockStatus,
  storyStatus,
} from '@/types/drama'

async function getCachedHeaders() {
  const header = await headers()
  return {
    host: header.get('x-forwarded-host') || header.get('host'),
    userAgent: header.get('user-agent') || '',
    ip: header.get('x-forwarded-for'),
    cookie: header.get('cookie'),
  }
}

const getCacheDramaDetail = cache(
  async (
    bookId: string,
    locale: string,
    channelId?: string,
    userAgent?: string
  ) => {
    return getH5BookDetail({ bookId, locale, channelId, userAgent })
  }
)

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>
}): Promise<Metadata> {
  const { locale, id } = await params
  const { host, userAgent } = await getCachedHeaders()
  const { channelId } = getSiteServerConfig(host || '')
  const response = await getCacheDramaDetail(id, locale, channelId, userAgent)
  const title = response?.book_title
  const description = response?.special_desc
  const images = response?.book_pic ? [{ url: response.book_pic }] : []
  const localeSegment = locale === routing.defaultLocale ? '' : `/${locale}`
  const url = `https://${host}${localeSegment}/drama/${id}`

  return {
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      images,
      type: 'website',
      url,
    },
  }
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>
  searchParams: Promise<{
    h5mode: string
    configId: string
    pixel: string
    mediaType: string
    cpId: string
    sort: string
  }>
}) {
  const { locale, id } = await params
  const searchParamsObject = await searchParams
  const { h5mode, configId, pixel, mediaType, cpId, sort } = searchParamsObject

  const { host, userAgent, ip, cookie } = await getCachedHeaders()
  const siteConfig = getSiteServerConfig(host || '')

  /** 用于日志收集 */
  const start = performance.now()

  const response = await getCacheDramaDetail(
    id,
    locale,
    siteConfig?.channelId,
    userAgent
  )
  if (!response || response?.status === storyStatus.BOOK_UNPUBLISH) {
    const params = new URLSearchParams()
    if (h5mode) params.set('h5mode', h5mode)
    if (configId) params.set('configId', configId)
    if (pixel) params.set('pixel', pixel)
    if (mediaType) params.set('mediaType', mediaType)
    const paramsString = params.toString()
    redirect(`/${locale}${paramsString ? `/?${paramsString}` : ''}`)
  }

  const {
    previewChapter,
    firstChapter,
    preLoad,
    screen_mode,
    readRecord,
    ...bookRest
  } = response || {}
  const preload: Array<ChapterItem | BookPreLoadType> = []
  /** 获取该书籍得起播序号 */
  let sortOrder = -1
  if (readRecord?.chapterId) {
    // const {
    //   chapterId,
    //   play_info = "",
    //   video_pic = "",
    //   serialNumber = 1,
    //   vtt_lang,
    //   is_lock = ChapterLockStatus.FREE,
    //   sec = 0,
    //   video_id,
    // } = {
    //   chapterId: 'lcw7xmmn6b',
    //   play_info: "e6P/I77ekl1o0vTa7NghOO87BpEiioxFqWe3mCtg7nql9v6hgQtiPdzLX/tXC3SmYHV6/Pv455hh/jeX1OaP85/adOABGcb5BQBVhjJpxN1lkAQ3rPAu4vfKuOWLhs3/59Xsxx6uFPCaqMwSxr2ImToOV3XKDwM1lyPpkDyiPvzi3Avt59SEiRAcubjnkQFow1oLjX3X19vjR91MsUiYFaoLIg16YDRh8iNIwpdL6YA/B8tvWPg4h11YM7AZQt6KQtPh+G3fcCmP+fY0jxDDQ1XkpkES218UPpFsk+3Bnyv9kIeaivmlO15mdGSlulOKAFkYCq3VPfvVBkZNWL3mc2HrDuxPZxSruqLI4FSaAJFF9yC6Up7+NKDPrWnVgSxqgFvgP3uv3Cf79Ldq2zDWU6HdBEmHVB1axLkDNBkrJnr1MG4LWWLVEKRz7gmk6tmH",
    //   video_pic: "https://dev-v-mps.crazymaplestudios.com/vtt-m3u8/311446795886530560/a62405f17903dfd648f59006959c60c1/cover.jpg",
    //   serialNumber: 3,
    //   vtt_lang: ["en", "ja"],
    //   is_lock: ChapterLockStatus.FREE,
    //   sec: 60,
    //   video_id: "c0d03fa54b9171f19c0de7f6d6480102"
    // };
    const {
      chapterId,
      play_info = '',
      video_pic = '',
      serialNumber = 1,
      vtt_lang,
      is_lock = ChapterLockStatus.FREE,
      sec = 0,
      video_id,
    } = readRecord
    const offset = previewChapter ? 0 : 1
    sortOrder = serialNumber - offset
    const beforeCurrentItems = Array.from(
      { length: sortOrder },
      (_, index) => ({ serial_number: offset + index }) as BookPreLoadType
    )
    preload.push(...beforeCurrentItems, {
      chapter_id: chapterId,
      serial_number: serialNumber,
      is_lock,
      play_info,
      video_pic,
      unlock_cost: 0,
      duration: 0,
      vtt_lang,
      playTime: sec,
      video_id,
      screen_mode,
    })
  } else {
    sortOrder = previewChapter && firstChapter ? 1 : 0
    /** 根据规则定义字段 */
    const transformChapter = (
      chapter: BookPreLoadType | ChapterItem,
      isFirstChapter: boolean,
      sortOrder: number
    ) => {
      return {
        ...chapter,
        is_lock: ChapterLockStatus.FREE,
        play_info: isFirstChapter ? chapter.play_info : '',
        sort: sortOrder,
        screen_mode,
      }
    }
    if (previewChapter) {
      const isFirstChapterAvailable = !!firstChapter
      preload.push(
        transformChapter(previewChapter, !isFirstChapterAvailable, 0)
      )
    }
    if (firstChapter) {
      preload.push(transformChapter(firstChapter, true, sortOrder))
    }
  }

  const localeSegment = locale === routing.defaultLocale ? '' : `/${locale}`
  const fullUrl = `https://${host}${localeSegment}/drama/${id}`

  //预请求adyen语言json文件
  const lang = localsMap[locale] || 'en-US'
  const adyenEnv = siteConfig?.adyen?.env
  const adyenTranslations = `https://checkoutshopper-${adyenEnv}.cdn.adyen.com/checkoutshopper/sdk/6.24.0/translations/${lang}.json`
  // console.log('preload', response, readRecord)

  /** 用于日志收集 */
  console.info(
    JSON.stringify({
      name: 'router-info',
      subName: 'player-router-info',
      time: start,
      duration: Math.round((performance.now() - start) * 10) / 10,
      url: fullUrl,
      userAgent,
      ip,
      host,
      cookie,
      params: searchParamsObject,
    })
  )
  return (
    <>
      <link
        rel='prefetch'
        href={adyenTranslations}
        as='fetch'
        crossOrigin='anonymous'
      />
      <VideoItems bookInfo={bookRest} preload={preload} sort={sortOrder} />
    </>
  )
}
