'use client'

import { useEffect, useMemo, useState } from 'react'
import { useI18n } from "@/i18n";
import { getSiteConfigClient } from '@/lib/config/site'
import type { BookShelfItemType, HallInfoV4Response } from '@/types/hall'

import Banner from './banner'
import FeedbackLink from './feedback-link'
import Popular from './popular'
// import Popup from './popup'
import TopHeader from './top-header'
import { getHallInfoV4 } from '@/lib/services/hallClient'

export function HomePage() {
  const { locale, t } = useI18n();
  const config = useMemo(() => getSiteConfigClient(), [])
  const [hallData, setHallData] = useState<HallInfoV4Response | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    /** 用于日志收集 */
    const start = Date.now()
    const host = window.location.host || ''
    const fullUrl = `${window.location.origin}/${locale}/`
    const userAgent = window.navigator.userAgent
    const cookie = document.cookie

    getHallInfoV4({ signal: controller.signal })
      .then((data) => {
        if (data) {
          setHallData(data)
        }
      })
      .catch((error) => {
        console.error('getHallInfoV4 error:', error)
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          console.info(
            JSON.stringify({
              name: 'router-info',
              subName: 'home-router-info',
              time: start,
              duration: Date.now() - start,
              url: fullUrl,
              userAgent,
              ip: '',
              host,
              cookie,
            })
          )
        }
      })

    return () => controller.abort()
  }, [locale])

  const { banners, bookShelfList } = useMemo(() => {
    const { lists = [] } = hallData || {}
    // Find the banner item in the lists
    const bannerItem = lists.find(
      (item) => item.banners && item.banners.length > 0
    )

    // Filter out the banner item and items with no books
    const bookShelfList = lists.filter(
      (item) => item.books && item.books.length > 0
    )

    return {
      banners: bannerItem?.banners || [],
      bookShelfList,
    }
  }, [hallData])

  const privacyStr = t('hall.hall-privacy') || ''
  const matchOne = privacyStr.match(/<linkOne>(.*?)<\/linkOne>/)
  const matchTwo = privacyStr.match(/<linkTwo>(.*?)<\/linkTwo>/)
  const linkOneText = matchOne ? matchOne[1] : 'Terms and Service'
  const linkTwoText = matchTwo ? matchTwo[1] : 'Privacy Policy'
  const showFeedback = config?.title === 'ReelShort'

  return (
    <>
      <TopHeader />
      <Banner bannerList={banners} />
      <div className='relative pl-[18px] pr-[18px] pt-[23px]'>
        {bookShelfList.map((bookShelf: BookShelfItemType) => {
          const { books = [], bs_id } = bookShelf
          if (books.length === 0) return null
          return (
            <div key={bs_id}>
              <div className='mb-[12px] flex items-center justify-between text-[16px] font-bold text-white/90'>
                <h2>{bookShelf.bookshelf_name}</h2>
              </div>
              <Popular {...bookShelf} />
            </div>
          )
        })}
      </div>
      <div className='mb-[56px] flex flex-col border-t border-white/10 bg-white/5 p-[16px]'>
        <div className='pb-[28px] text-[16px] font-[500] text-white'>
          {t('hall.about')}
        </div>
        <div className='flex flex-col items-start text-[12px] font-[400] text-white/50'>
          {showFeedback && (
            <FeedbackLink
              className='mb-[24px] block cursor-pointer border-0 bg-transparent p-0 text-left text-white/50'
              label={t('checkout.feedback')}
            />
          )}
          <a
            className='block'
            href={config?.userAgreement || '/user-agreement.html'}
          >
            {linkOneText}
          </a>
          <a
            className='mt-[24px]'
            href={config?.privacyAgreement || '/privacy-agreement.html'}
          >
            {linkTwoText}
          </a>
        </div>
      </div>
      {/* <Popup /> */}
    </>
  )
}
