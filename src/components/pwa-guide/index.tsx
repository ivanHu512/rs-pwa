'use client'
import { useI18n } from '@/i18n'
import React, {
  startTransition,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'

import CustomerDrawer from '@/components/drawer'
import { Button } from '@/components/ui/button'
import useManifest from '@/hooks/use-manifest'
import { useReport } from '@/hooks/use-report'
import { getSiteConfigClient } from '@/lib/config/site'
import { localKeyPwaStatus } from '@/lib/constant'
import {
  cn,
  detectionPwaStandalone,
  detectWebView,
  getMobileInfo,
} from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'

interface GuideProcessProps {
  sort: number
  title: string
  pic: string
}

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const moreIcon = (
  <span className='mx-[2px] inline-block rounded-[4px] bg-[#007AFF] align-middle'>
    <span className='flex h-[16px] w-[28px] items-center justify-between px-[4px]'>
      <i className='block h-[4px] w-[4px] rounded-full bg-white'></i>
      <i className='block h-[4px] w-[4px] rounded-full bg-white'></i>
      <i className='block h-[4px] w-[4px] rounded-full bg-white'></i>
    </span>
  </span>
)

function renderBrowserTip(text: string) {
  const [before, after = ''] = text.split('<moreIcon></moreIcon>')

  return (
    <>
      {before}
      {moreIcon}
      {after}
    </>
  )
}

const PwaGuide: React.FC = () => {
  const { t } = useI18n()

  const siteConfig = getSiteConfigClient()

  // const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>();
  const { pwaGuideReport } = useReport()
  const { createManifest, destroyManifest } = useManifest()
  const __deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null)
  const [isAddPwaVisible, setIsAddPwaVisible] = useState(false)
  const [isBrowserTipVisible, setIsBrowserTipVisible] = useState(false)
  const [isGuideImageVisible, setIsGuideImageVisible] = useState(false)
  const userInfo = useDramaStore((state) => state.userInfo)

  const processData: Array<GuideProcessProps> = [
    {
      sort: 1,
      title: t('pwa.click-share'),
      pic: 'https://v-mps.crazymaplestudios.com/images/989933e0-d709-11f0-84ad-6b5693b490dc.png',
    },
    {
      sort: 2,
      title: t('pwa.add-select'),
      pic: 'https://v-mps.crazymaplestudios.com/images/9899f730-d709-11f0-84ad-6b5693b490dc.png',
    },
    {
      sort: 3,
      title: t('pwa.click-add'),
      pic: 'https://v-mps.crazymaplestudios.com/images/988ed3a0-d709-11f0-84ad-6b5693b490dc.png',
    },
  ]

  const handleAppInstalled = (e: Event) => {
    console.log('pwa install completed')
    localStorage.setItem(localKeyPwaStatus, '1')
    pwaGuideReport({ _action: 'install_done' })
  }

  const handleBeforeInstall = (e: Event) => {
    console.log('pwa install ready')
    e.preventDefault()
    localStorage.setItem(localKeyPwaStatus, '0')
    setIsAddPwaVisible(true)
    __deferredPrompt.current = e as BeforeInstallPromptEvent
  }

  useLayoutEffect(() => {
    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
    }
  }, [])

  useEffect(() => {
    if (detectWebView()) {
      setIsAddPwaVisible(true)
      pwaGuideReport({ _action: 'show' })
      return
    }
    const isPwaEnv = detectionPwaStandalone()
    if (isPwaEnv) {
      localStorage.setItem(localKeyPwaStatus, '1')
    }
    const isPwaLocalStatus = localStorage.getItem(localKeyPwaStatus)
    console.log(
      '__deferredPrompt',
      isPwaEnv,
      isPwaLocalStatus,
      __deferredPrompt.current
    )
    if (!isPwaEnv && isPwaLocalStatus !== '1') {
      pwaGuideReport({ _action: 'show' })
      setIsAddPwaVisible(true)
    }
    window.addEventListener('appinstalled', handleAppInstalled)
    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])
  /**
   * 监听uid变化，实时修改pwa内容
   */
  useEffect(() => {
    if (userInfo?.uid) {
      startTransition(createManifest)
    }
    return () => destroyManifest()
  }, [userInfo?.uid])

  const handlePwaAction = useCallback(async () => {
    console.log(
      '设备类型',
      getMobileInfo().isIos,
      navigator.userAgent,
      __deferredPrompt.current
    )
    if (detectWebView()) {
      setIsBrowserTipVisible(true)
      pwaGuideReport({ _action: 'show', sub_event_name: 'pwa_guide_click' })
      return
    }
    if (getMobileInfo().isIos) {
      setIsGuideImageVisible(true)
      pwaGuideReport({ _action: 'add_click' })
      pwaGuideReport({ _action: 'show', sub_event_name: 'pwa_guide_click' })
      return
    }
    try {
      if (!__deferredPrompt.current) return
      pwaGuideReport({ _action: 'add_click' })
      await __deferredPrompt.current?.prompt()
      const choice = await __deferredPrompt.current?.userChoice
      if (choice?.outcome === 'accepted') {
        setIsAddPwaVisible(false)
        pwaGuideReport({ _action: 'install_click' })
      }
      __deferredPrompt.current = null
    } catch (error) {
      console.error('PWA install prompt failed', error)
      __deferredPrompt.current = null
    }
  }, [])
  return (
    <>
      {isAddPwaVisible && (
        <div
          className='fixed bottom-0 z-[50] flex h-[56px] w-full max-w-xl items-center justify-between bg-white px-[16px] py-[8px]'
          onClick={handlePwaAction}
        >
          <div className='flex items-center'>
            <img
              alt={siteConfig?.title || ''}
              className='mr-[8px] rounded-[8px]'
              style={{ border: siteConfig?.pwaBorderColor }}
              loading='lazy'
              width={40}
              height={40}
              src={siteConfig?.favicon || ''}
            />
            <span className='line-clamp-2 text-[14px] font-[500] text-[#141414]'>
              {t('pwa.add-to-home-screen', { app: siteConfig?.title || '' })}
            </span>
          </div>
          <Button className='h-full w-[96px] min-w-[70px] rounded-[4px] text-[16px] font-[700] text-white'>
            {t('pwa.add')}
          </Button>
        </div>
      )}
      {isBrowserTipVisible && (
        <div
          className='fixed top-0 z-[150] flex h-[100dvh] h-[100vh] w-full max-w-xl flex-col items-end bg-black/65'
          onClick={() => {
            setIsBrowserTipVisible(false)
          }}
        >
          <img
            alt={siteConfig?.title || ''}
            className='my-[8px] mr-[16px]'
            loading='lazy'
            width={42}
            height={54}
            src='https://v-mps.crazymaplestudios.com/images/ee94e250-d6fd-11f0-84ad-6b5693b490dc.png'
          />
          <div className='mr-[25px] w-[276px] rounded-[8px] bg-white p-[16px]'>
            <span className='text-[14px] font-[400] text-black'>
              {renderBrowserTip(
                t('pwa.click-browser', { app: siteConfig?.title || '' })
              )}
            </span>
          </div>
        </div>
      )}
      <CustomerDrawer
        className='border-none px-0 pb-0'
        isOpen={isGuideImageVisible}
        onOpenChange={setIsGuideImageVisible}
        zIndex={60}
      >
        <div className='px-[16px]'>
          <div className='mb-[24px] text-[16px] font-[700] text-white'>
            {t('pwa.add-to-home-screen', { app: siteConfig?.title || '' })}
          </div>
          <div>
            {processData.map((item) => (
              <GuideProcess
                key={item.title}
                sort={item.sort}
                title={item.title}
                pic={item.pic}
                siteTitle={siteConfig?.title || ''}
              />
            ))}
          </div>
        </div>
      </CustomerDrawer>
    </>
  )
}

const GuideProcess: React.FC<GuideProcessProps & { siteTitle: string }> = ({
  sort,
  title,
  pic,
  siteTitle,
}) => {
  return (
    <div className='mb-[24px] flex'>
      <span className='flex h-[20px] w-[20px] items-center justify-center rounded-full bg-white text-[14px] font-[700] text-[#141414]'>
        {sort}
      </span>
      <div className='ml-[12px] flex flex-1 flex-col justify-center'>
        <span className='mb-[8px] text-[14px] font-[400] text-white'>
          {title}
        </span>
        <img
          alt={siteTitle}
          className='h-auto w-full'
          loading='lazy'
          width={350}
          height={83}
          src={pic}
        />
      </div>
    </div>
  )
}

export default PwaGuide
