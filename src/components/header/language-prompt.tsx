'use client'

import { useEffect, useMemo, useState } from 'react'

import { UilAngleRight } from '@/components/ui/icons'
import { useI18n } from '@/i18n'
import { getSupportedLocale, type AppLocale } from '@/i18n/language'
import { setLocalStorage } from '@/lib/storageUtils'

function renderPromptText(prompt: string, languageName: string) {
  const [before, after = ''] = prompt.split('{language}')

  return (
    <>
      {before}
      <span className='mx-0.5 text-[#2E8AE5] underline underline-offset-4'>
        {languageName}
      </span>
      {after}
    </>
  )
}

export const LanguagePrompt = () => {
  const { locale: currentLocale, languages, setLocale, t } = useI18n()
  const [suggestedLocale, setSuggestedLocale] = useState<AppLocale | null>(null)
  const [isVisible, setIsVisible] = useState(false)

  const suggestedLanguage = useMemo(
    () => languages.find((language) => language.locale === suggestedLocale),
    [languages, suggestedLocale]
  )

  useEffect(() => {
    const browserLocales = navigator.languages?.length
      ? navigator.languages
      : [navigator.language]

    const match = browserLocales
      .map((language) => getSupportedLocale(language))
      .find((locale): locale is AppLocale => !!locale)

    if (match && match !== currentLocale) {
      setSuggestedLocale(match)
      setIsVisible(true)
      return
    }

    setSuggestedLocale(null)
    setIsVisible(false)
  }, [currentLocale])

  const handleSelect = () => {
    if (!suggestedLocale) return

    setLocalStorage('language', suggestedLocale)
    setLocale(suggestedLocale)
    setIsVisible(false)
  }

  const handleDismiss = () => {
    setIsVisible(false)
  }

  if (!isVisible || !suggestedLocale || !suggestedLanguage) return null

  const prompt = t(
    'language.prompt',
    { language: '{language}' },
    'Maybe you would like to switch to {language}'
  )

  return (
    <div className='z-[100] flex min-h-[44px] w-full items-center justify-between border-b border-white/5 bg-[#141414] px-[16px] text-[13px] text-white shadow-lg transition-all duration-300'>
      <button
        type='button'
        className='mr-4 flex min-w-0 flex-1 items-center gap-1 bg-transparent p-0 text-left transition-transform active:scale-95'
        onClick={handleSelect}
      >
        <span className='truncate font-medium opacity-90'>
          {renderPromptText(prompt, suggestedLanguage.name)}
        </span>
        <UilAngleRight className='h-[18px] w-[18px] flex-shrink-0 fill-white opacity-90' />
      </button>

      <button
        type='button'
        onClick={handleDismiss}
        className='flex h-full flex-shrink-0 cursor-pointer items-center bg-transparent p-0 opacity-60 transition-opacity hover:opacity-100'
      >
        <span className='h-[20px] w-[20px] bg-[url(https://v-mps.crazymaplestudios.com/images/0b945d80-1129-11f1-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat' />
      </button>
    </div>
  )
}
