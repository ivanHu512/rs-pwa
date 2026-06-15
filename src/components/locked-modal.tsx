'use client'
import { useI18n } from '@/i18n'
import React, { memo, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { getSiteConfigClient } from '@/lib/config/site'
import { cn } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'

import BackHome from './back-home'

const animationTime = 200
interface PlayerBtnProps {
  /**展示按钮 */
  isOpen: boolean
  /**控制展示 */
  onOpenChange?: (flag: boolean) => void
}

const LockedModal: React.FC<PlayerBtnProps> = ({ isOpen, onOpenChange }) => {
  const { t } = useI18n()
  const [isVisible, setIsVisible] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rafRef = useRef<number | null>(null)
  const setOpenPayModal = useCheckoutStore((state) => state.setOpenPayModal)
  /**
   * 控制组件状�?
   * 使用 requestAnimationFrame 确保浏览器已经渲染了初始状态（opacity-0�?
   */
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (isOpen) {
      setIsVisible(true)
      rafRef.current = requestAnimationFrame(() => {
        setIsAnimating(true)
      })
    } else {
      setIsAnimating(false)
      timeoutRef.current = setTimeout(() => {
        setIsVisible(false)
      }, animationTime)
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [isOpen])

  /** 如果为false，则不渲�?*/
  if (!isVisible) {
    return null
  }
  return (
    <>
      <div
        className={cn(
          'absolute inset-0 z-[50] flex h-full w-full items-center justify-center bg-black/65 opacity-0 transition-opacity',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
        style={{ transitionDuration: `${animationTime}ms` }}
        onClick={(e) => e.stopPropagation()}
      >
        <BackHome />
        <div
          className={cn(
            'z-[50] flex scale-95 flex-col items-center justify-center px-[32px] opacity-0 transition-all',
            isAnimating ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
          style={{ transitionDuration: `${animationTime}ms` }}
        >
          <i className='block h-[64px] w-[64px] bg-[url(https://v-mps.crazymaplestudios.com/images/1b520d50-c4f1-11f0-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat'></i>
          <div className='mb-[48px] mt-[24px] text-center text-[18px] font-[700] text-white/90'>
            {t('video.un-paid')}
          </div>

          <Button
            className='flex h-[48px] w-[311px] items-center justify-center gap-1 rounded-[4px] text-[16px] font-[700] text-white/90'
            onClick={(e) => {
              setOpenPayModal(true)
            }}
            onTouchEnd={(e) => {
              e.stopPropagation()
              setOpenPayModal(true)
            }}
          >
            {t('video.more-lock')}
          </Button>
        </div>
      </div>
    </>
  )
}

export default memo(LockedModal)
