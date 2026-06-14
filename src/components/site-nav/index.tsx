'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { useTranslations } from 'next-intl'
import * as React from 'react'

import LangSelector from '@/components/lang-selector'

import { getSiteConfigClient } from '@/lib/config/site'

export default function MainNav() {
  const segment = useSelectedLayoutSegment()

  console.log({ segment })

  const t = useTranslations('Common')
  const siteConfig = getSiteConfigClient()
  if (!siteConfig) return null

  return (
    <div className='flex w-full'>
      <div className='container mx-auto flex items-center justify-between'>
        <div className='flex items-center space-x-2'>
          <Link href='/' className='hidden items-center space-x-2 md:flex'>
            <Image
              src={siteConfig.favicon}
              alt={siteConfig.title}
              width={36}
              height={36}
              unoptimized
            />
            <span className='hidden font-bold sm:inline-block'>
              {siteConfig.title}
            </span>
          </Link>

          <Link href='/movie' className='hidden items-center space-x-2 md:flex'>
            {t('home')}
          </Link>
          <Link href='/movie' className='hidden items-center space-x-2 md:flex'>
            {t('categories')}
          </Link>
          <Link href='/movie' className='hidden items-center space-x-2 md:flex'>
            {t('fandom')}
          </Link>
        </div>

        <div>
          <LangSelector />
        </div>
      </div>
    </div>
  )
}
