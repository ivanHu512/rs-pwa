'use client'

import React, { useEffect, useState } from 'react'
import { NextIntlClientProvider, useLocale, useTranslations } from 'next-intl'
import { routing } from '@/i18n/routing'
import { i18nLabel } from '@/i18n/language'
import { useSearchParams } from 'next/navigation'
import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { UilAngleRight } from '@/components/ui/icons'
import { setLocalStorage } from '@/lib/storageUtils'

const { locales } = routing

const PromptContent = ({ suggestedLocale }: { suggestedLocale: string }) => {
  const t = useTranslations('language')
  const name = i18nLabel[suggestedLocale]?.name || suggestedLocale

  return (
    <>
      {t.rich('prompt', {
        language: (
          <span
            key={name}
            className='mx-0.5 text-[#2E8AE5] underline underline-offset-4'
          >
            {name}
          </span>
        ),
      } as any)}
    </>
  )
}

export const LanguagePrompt = () => {
  const currentLocale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const queryString = searchParams.toString()
  const href = queryString ? `${pathname}?${queryString}` : pathname
  const [suggestedLocale, setSuggestedLocale] = useState<string | null>(null)
  const [messages, setMessages] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  const isActuallyVisible = !!(isVisible && suggestedLocale && messages)

  useEffect(() => {
    // Only run on client to avoid hydration mismatch
    const browserLang = navigator.language
    const browserPrefix = browserLang.split('-')[0]

    // Find if browser language is supported and not current
    // Check for exact match first (e.g. en-US), then prefix (e.g. en)
    const match =
      locales.find((l) => l === browserLang) ||
      locales.find((l) => l === browserPrefix)

    if (match && match !== currentLocale) {
      setSuggestedLocale(match)
      setIsVisible(true)
      // 动态加载对应语言包
      import(`@/locales/${match}.json`)
        .then((m) => {
          setMessages(m.default)
        })
        .catch((err) => {
          console.error('Failed to load locale messages', err)
        })
    }
  }, [currentLocale])

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isActuallyVisible || !suggestedLocale || !messages) return null
  return (
    <div className='z-[100] flex min-h-[44px] w-full items-center justify-between border-b border-white/5 bg-[#141414] px-[16px] text-[13px] text-white shadow-lg transition-all duration-300'>
      <Link
        href={href}
        locale={suggestedLocale as any}
        className='mr-4 flex items-center gap-1 truncate transition-transform active:scale-95'
        onClick={() => {
          setLocalStorage('language', suggestedLocale)
          setIsVisible(false)
        }}
      >
        <span className='truncate font-medium opacity-90'>
          <NextIntlClientProvider locale={suggestedLocale} messages={messages}>
            <PromptContent suggestedLocale={suggestedLocale} />
          </NextIntlClientProvider>
        </span>
        <UilAngleRight className='h-[18px] w-[18px] flex-shrink-0 fill-white opacity-90' />
      </Link>

      <div
        onClick={handleDismiss}
        className='flex h-full flex-shrink-0 cursor-pointer items-center opacity-60 transition-opacity hover:opacity-100'
      >
        <div className='h-[20px] w-[20px] bg-[url(https://v-mps.crazymaplestudios.com/images/0b945d80-1129-11f1-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat' />
      </div>
    </div>
  )
}
