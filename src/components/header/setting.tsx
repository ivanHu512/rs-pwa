'use client'

import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useTranslations } from 'next-intl'
import React, { useEffect, useState } from 'react'

import { images } from '@/assets/images'
import Drawer from '@/components/ui/custom-drawer'
import useFeedback from '@/hooks/use-feedback'
import { i18nLabel } from '@/i18n/language'
import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { isReelshort } from '@/lib/config/site'
import { setReportPathName } from '@/lib/index'
import { reportSDK } from '@/lib/report'
import { setLocalStorage } from '@/lib/storageUtils'
import { cn } from '@/lib/utils'

const { locales } = routing

export const Setting = () => {
  const [open, setOpen] = useState(false)
  const [langExpanded, setLangExpanded] = useState(true)
  const currentLocale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { getFeedbackUrl } = useFeedback()
  const t = useTranslations()
  const [isReelShort, setIsReelShort] = useState(false)

  useEffect(() => {
    setIsReelShort(isReelshort())
  }, [])

  const queryString = searchParams.toString()
  const href = queryString ? `${pathname}?${queryString}` : pathname

  const handleOpen = () => {
    reportSDK.eventReport({
      event_name: 'm_custom_event',
      sub_event_name: 'setting_click',
      properties: {
        _action: 'setting_click',
        _scene_name: 'main_scene',
        _page_name: setReportPathName(pathname),
        curr_lang_id: currentLocale,
      },
    })
    setOpen(true)
  }

  const handleSelect = (locale: string) => {
    setLocalStorage('language', locale)
    reportSDK.eventReport({
      event_name: 'm_custom_event',
      sub_event_name: 'setting_click',
      properties: {
        _action: 'lang_select',
        _scene_name: 'main_scene',
        _page_name: setReportPathName(pathname),
        curr_lang_id: currentLocale,
        selected_lang_id: locale,
      },
    })
    setOpen(false)
  }

  const handleFeedback = () => {
    reportSDK.eventReport({
      event_name: 'm_custom_event',
      sub_event_name: 'setting_click',
      properties: {
        _action: 'setting_feedback_click',
        _scene_name: 'main_scene',
        _page_name: setReportPathName(pathname),
        curr_lang_id: currentLocale,
      },
    })
    getFeedbackUrl()
    setOpen(false)
  }

  return (
    <>
      <div
        className='flex h-[20px] w-[20px] cursor-pointer items-center justify-center'
        onClick={handleOpen}
      >
        <Image
          src={images.settingIcon}
          alt='setting switch'
          width={20}
          height={20}
          unoptimized
        />
      </div>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        className='h-[100dvh] rounded-none'
        showCloseButton={false}
        zIndex={200}
      >
        <div className='flex h-full flex-col pt-[env(safe-area-inset-top)]'>
          <div className='flex h-[48px] items-center justify-start border-b border-white/10 px-[16px]'>
            <div
              className='h-[24px] w-[24px] cursor-pointer bg-[url(https://v-mps.crazymaplestudios.com/images/0b945d80-1129-11f1-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat'
              onClick={() => setOpen(false)}
            ></div>
          </div>

          <div className='flex-1 overflow-y-auto pt-[8px]'>
            <div className='px-[16px]'>
              <div
                className='flex cursor-pointer items-center justify-between py-[12px]'
                onClick={() => setLangExpanded(!langExpanded)}
              >
                <div className='flex items-center gap-[12px]'>
                  <img
                    src={images.languageIcon}
                    className='h-[20px] w-[20px] opacity-70'
                    alt=''
                  />
                  <span className='text-[16px] font-[500] text-white/90'>
                    {t('language.title')}
                  </span>
                </div>
                <div
                  className={cn(
                    'flex h-[20px] w-[20px] items-center justify-center transition-transform duration-300',
                    langExpanded ? 'rotate-180' : ''
                  )}
                >
                  <svg width='12' height='12' viewBox='0 0 12 12' fill='none'>
                    <path
                      d='M2.5 4.5L6 8L9.5 4.5'
                      stroke='white'
                      strokeOpacity='0.9'
                      strokeWidth='1.5'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                    />
                  </svg>
                </div>
              </div>

              <div
                className={cn(
                  'overflow-hidden transition-[max-height] duration-300 ease-in-out',
                  langExpanded ? 'max-h-[500px]' : 'max-h-0'
                )}
              >
                <div className='flex flex-col pb-[12px]'>
                  {locales.map((locale) => (
                    <Link
                      key={locale}
                      href={href}
                      locale={locale}
                      className='flex items-center py-[10px] pl-[32px] active:opacity-70'
                      onClick={() => handleSelect(locale)}
                    >
                      <span
                        className={cn(
                          'text-[16px] font-[400]',
                          locale === currentLocale
                            ? 'text-primary'
                            : 'text-white/90'
                        )}
                      >
                        {i18nLabel[locale].name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {isReelShort && (
              <>
                <div className='mx-[16px] h-[0.5px] bg-white/5'></div>
                <div className='px-[16px]'>
                  <div
                    className='flex cursor-pointer items-center py-[12px] active:opacity-70'
                    onClick={handleFeedback}
                  >
                    <div className='flex items-center gap-[12px]'>
                      <img
                        src={images.feedBackIcon}
                        className='h-[20px] w-[20px] opacity-70'
                        alt=''
                      />
                      <span className='text-[16px] font-[500] text-white/90'>
                        {t('checkout.feedback')}
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </Drawer>
    </>
  )
}
