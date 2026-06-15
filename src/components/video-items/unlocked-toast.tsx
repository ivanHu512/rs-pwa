import { useI18n } from '@/i18n'
import React, { memo, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { getSiteConfigClient } from '@/lib/config/site'
import { cn, isUserVip } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
const delay = 3000
const siteConfig = getSiteConfigClient()
const UnlockedToast: React.FC = () => {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(false)
  const { accountInfo, lockedToastVisible, updateLockedToastVisible } =
    useDramaStore(
      useShallow((state) => ({
        accountInfo: state.accountInfo,
        lockedToastVisible: state.lockedToastVisible,
        updateLockedToastVisible: state.updateLockedToastVisible,
      }))
    )
  /**
   * 3s，导航条消失
   */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    if (lockedToastVisible) {
      requestAnimationFrame(() => {
        setIsVisible(true)
      })
      timer = setTimeout(() => {
        updateLockedToastVisible(false)
      }, delay)
    } else {
      setIsVisible(false)
    }
    return () => clearTimeout(timer)
  }, [lockedToastVisible])
  /**
   * 渲染不同内容
   */
  const modules = useMemo(() => {
    if (isUserVip(accountInfo)) {
      return (
        <div
          className='flex h-[48px] w-full items-center rounded-[4px] border-[0.5px] border-transparent px-[12px]'
          style={{
            background: siteConfig?.unlockedToastBg,
            ...(siteConfig?.unlockedToastBoxShadow
              ? { boxShadow: siteConfig.unlockedToastBoxShadow }
              : {}),
          }}
        >
          <i
            className='mr-[8px] block h-[20px] w-[20px] bg-contain bg-no-repeat'
            style={{ backgroundImage: `url(${siteConfig?.vipIcon})` }}
          ></i>
          <label
            className='text-[12px] font-[400]'
            style={{
              color: siteConfig?.unlockedToastTextColor,
            }}
          >
            {t('video.acc')}
          </label>
        </div>
      )
    }
    return (
      <div className='flex w-full items-center rounded-[4px] bg-[#3D3D3D] p-[12px]'>
        <i
          className='mr-[8px] block h-[20px] w-[20px] bg-contain bg-no-repeat'
          style={{ backgroundImage: `url(${siteConfig?.coinIcon})` }}
        ></i>
        <label className='text-[12px] font-[400]'>{t('video.lock-acc')}</label>
      </div>
    )
  }, [accountInfo])
  return (
    <>
      {lockedToastVisible && (
        <div
          className={cn(
            'absolute bottom-[120px] left-0 z-[99] w-full px-[16px] text-white/90 opacity-0 transition-opacity duration-500',
            isVisible ? 'opacity-100' : 'opacity-0'
          )}
        >
          {modules}
        </div>
      )}
    </>
  )
}

export default memo(UnlockedToast)
