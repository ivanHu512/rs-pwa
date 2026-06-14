'use client'

import { useLocale } from 'next-intl'
import { useMemo } from 'react'

import { GrommetIconsLanguage, UIArrowsDown } from '@/components/ui/icons'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { i18nLabel } from '@/i18n/language'
import { Link } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { cn } from '@/lib/utils'
import { setLocalStorage } from '@/lib/storageUtils'

interface IProps {
  className?: string
}

const { locales } = routing

const LangSelector = (props: IProps) => {
  const { className } = props
  const lang = useLocale()

  const handlerClick = (e: any, locale: string) => {
    setLocalStorage('language', locale)
    // 登录注册上报
    // reportCacheHandle({
    //   event_name: 'm_custom_event',
    //   sub_event_name: 'language_stat',
    //   properties: {
    //     _action: 'lang_select',
    //     _scene_name: getSceneName(router.pathname),
    //     _page_name: getPageName(router.pathname),
    //     curr_lang_id: lang,
    //     selected_lang_id: locale,
    //     lang_id_list: locales,
    //   },
    // })
  }

  const renderList = useMemo(() => {
    return (
      <div className='rounded-8px overflow-hidden md:rounded-[8px]'>
        {locales.map((locale) => {
          return (
            <Link
              onClick={(e) => {
                handlerClick(e, locale)
              }}
              href='/'
              locale={locale}
              key={locale}
              className={cn(
                `flex h-[44px] w-[230px] items-center justify-center px-6 md:h-[44px] md:w-[230px] md:justify-start`,
                locale === lang ? 'font-bold text-primary' : 'text-white/90'
              )}
            >
              {i18nLabel[locale].name}
            </Link>
          )
        })}
      </div>
    )
  }, [])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <div
          className={cn(
            'hover:text-rsColor group flex cursor-pointer items-center justify-center gap-1 text-white',
            className
          )}
        >
          <GrommetIconsLanguage className='text-xl md:text-xl' />
          <span className='hidden text-base lg:block'>
            {i18nLabel[lang].name}
          </span>
          <UIArrowsDown className='hidden text-xs transition-all group-hover:rotate-180 md:block' />
        </div>
      </PopoverTrigger>
      <PopoverContent className='p-0'>{renderList}</PopoverContent>
    </Popover>
  )
}

export default LangSelector
