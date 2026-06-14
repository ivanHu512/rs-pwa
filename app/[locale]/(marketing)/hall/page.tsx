import { headers } from 'next/headers'
import { getTranslations } from 'next-intl/server'

import { getSiteServerConfig } from '@/lib/config/site-server'
import { getHallFromServer } from '@/lib/services/hallServer'
import { BookShelfItemType } from '@/types/hall'

import Banner from './banner'
import FeedbackLink from './feedback-link'
import Popular from './popular'
import Popup from './popup'
import TopHeader from './top-header'

// Force SSR by setting revalidate to 0.
export const revalidate = 0

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale = 'en' } = await params
  const t = await getTranslations({ locale })

  const header = await headers()
  /** 用于日志收集 */
  const start = Date.now()
  const host = header.get('x-forwarded-host') || header.get('host') || ''
  const fullUrl = `https://${host}/${locale}/`
  const userAgent = header.get('user-agent')
  const ip = header.get('x-forwarded-for')
  const cookie = header.get('cookie')

  const config = getSiteServerConfig(host)

  const data = await getHallFromServer({
    locale,
    headers: header,
    channelId: config?.channelId,
  })
  const { lists = [] } = data || {}

  // Find the banner item in the lists
  const bannerItem = lists.find(
    (item) => item.banners && item.banners.length > 0
  )
  const banners = bannerItem?.banners || []

  // Filter out the banner item and items with no books
  const bookShelfList = lists.filter(
    (item) => item.books && item.books.length > 0
  )

  const privacyStr = t.raw('hall.hall-privacy') || ''
  const matchOne = privacyStr.match(/<linkOne>(.*?)<\/linkOne>/)
  const matchTwo = privacyStr.match(/<linkTwo>(.*?)<\/linkTwo>/)
  const linkOneText = matchOne ? matchOne[1] : 'Terms and Service'
  const linkTwoText = matchTwo ? matchTwo[1] : 'Privacy Policy'
  const showFeedback = config?.title === 'ReelShort'

  console.info(
    JSON.stringify({
      name: 'router-info',
      subName: 'home-router-info',
      time: start,
      duration: Date.now() - start,
      url: fullUrl,
      userAgent,
      ip,
      host,
      cookie,
    })
  )

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
      <Popup />
    </>
  )
}
