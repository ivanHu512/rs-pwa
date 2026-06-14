'use client'
import { useLocation } from "react-router-dom";
import { useI18n } from '@/i18n'
import React, { CSSProperties, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { images } from '@/assets/images'
import BackHome from '@/components/back-home'
import UserStatus from '@/components/header/user-status'
import { cn, isUserVip } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'
import { useLoginStore } from '@/stores/login-store'

import { LanguagePrompt } from './language-prompt'
import { Setting } from './setting'
import { setReportPathName } from '@/lib/index'
import { getSiteConfigClient } from '@/lib/config/site'
import { useReport } from '@/hooks/use-report'

// 控制栏动画的持续时间（毫秒）
const delay = 300

type IProps = {
  isShow?: boolean
  className?: string
  style?: CSSProperties
}

const Header: React.FC<IProps> = ({ className, isShow, style = {} }) => {
  const pathname = useLocation().pathname;
  const { locale, t } = useI18n()

  const siteConfig = getSiteConfigClient()

  const isHall = useMemo(() => {
    return (
      pathname?.includes('/hall') ||
      pathname === `/${locale}` ||
      pathname === '/'
    )
  }, [pathname, locale])

  const isDrama = useMemo(() => {
    return pathname.includes('/drama')
  }, [pathname])

  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)

  const { openUserInfoBubble, setOpenUserInfoBubble } = useLoginStore(
    useShallow((state) => ({
      openUserInfoBubble: state.openUserInfoBubble,
      setOpenUserInfoBubble: state.setOpenUserInfoBubble,
    }))
  )
  const { pageClickReport } = useReport()
  const { accountInfo, userInfo, controlStatus } = useDramaStore(
    useShallow((state) => ({
      accountInfo: state.accountInfo,
      userInfo: state.userInfo,
      controlStatus: state.controlStatus,
    }))
  )

  const { setVipSuccessModal } = useCheckoutStore(
    useShallow((state) => ({
      setVipSuccessModal: state.setVipSuccessModal,
    }))
  )

  const isVip = isUserVip(accountInfo)
  /**
   * 3s，导航条消失，逻辑待定
   */
  useEffect(() => {
    if (isShow) return
    let hideTimer: number
    let shotTimer: number
    if (controlStatus) {
      setShouldRender(true)
      shotTimer = setTimeout(() => {
        setIsVisible(true)
      }, 10)
    } else {
      if (shouldRender) {
        setIsVisible(false)
        hideTimer = setTimeout(() => {
          setShouldRender(false)
          setOpenUserInfoBubble(false)
        }, delay)
      }
    }
    return () => {
      if(hideTimer) {
        clearTimeout(hideTimer)
      }
      if(shotTimer) {
        clearTimeout(shotTimer)
      }
      // 隐藏
      setIsVisible(false)
    }
  }, [controlStatus, isShow])

  const isShowHeader = useMemo(() => {
    return isShow || isVisible
  }, [isShow, isVisible])

  if (!siteConfig) return null
  // if (!shouldRender) {
  //   return null;
  // }
  return (
    <div
      className={cn(
        'pointer-events-none fixed left-0 right-0 top-0 z-[49] mx-auto flex w-full max-w-xl flex-col bg-black transition-all duration-300',
        isShowHeader ? 'opacity-100' : 'opacity-0'
      )}
      style={{
        right: 'var(--removed-body-scroll-bar-size, 0px)',
        paddingTop: 'env(safe-area-inset-top)',
        pointerEvents: isShowHeader ? 'initial' : 'none',
      }}
    >
      {isHall && (
        <div className='pointer-events-auto'>
          <LanguagePrompt />
        </div>
      )}
      <div
        className={cn(
          'pointer-events-auto relative flex h-[48px] w-full items-center justify-center bg-black px-[16px]',
          className
        )}
        style={{
          backdropFilter: 'blur(0.1px)',
          WebkitBackdropFilter: 'blur(0.1px)',
          transform: 'translateZ(0)',
          ...style,
        }}
      >
        <div className='absolute left-[16px] flex items-center'>
          {isHall && <Setting />}
        </div>

        <div className='flex items-center'>
          <img
            alt={siteConfig.title}
            loading='lazy'
            width={127}
            height={24}
            src={siteConfig.headerLogo || ''}
          />
        </div>

        <div className='absolute right-[16px] flex items-center justify-center'>
          {isVip && (
            <span
              className='flex items-center justify-center'
              onClick={() =>
                setVipSuccessModal({
                  open: true,
                  type: 2,
                })
              }
            >
              <i
                className='h-[24px] w-[24px] bg-contain bg-no-repeat'
                style={{ backgroundImage: `url(${siteConfig.vipIcon})` }}
              ></i>
            </span>
          )}
          <div
            className='relative ml-[16px] h-[24px] w-[24px] rounded-full'
            onClick={() => {
              setOpenUserInfoBubble(!openUserInfoBubble)
              pageClickReport({
                _page_name: setReportPathName(pathname),
                _element_name: 'avatar',
              })
            }}
          >
            <img
              src={userInfo?.pic || images.defaultActor}
              className='h-full w-full rounded-full'
              alt=''
            />
          </div>
          <UserStatus />
        </div>
        {isDrama && <BackHome />}
      </div>
    </div>
  )
}

export default Header
