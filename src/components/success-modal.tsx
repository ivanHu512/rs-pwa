'use client'

import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import Marquee from 'react-fast-marquee'
import { useShallow } from 'zustand/shallow'

import { useOneLink } from '@/hooks/use-nav-chapter'
import { useReport } from '@/hooks/use-report'
import {
  getSiteConfigClient,
  isReelshort,
  type VipSuccessDividerColor,
} from '@/lib/config/site'
import { localKeyProduct } from '@/lib/constant'
import { cn, formateDate } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'

import CustomerDrawer from './drawer'

const siteConfig = getSiteConfigClient()
const VIP_SUCCESS_DIVIDER_GRADIENT_ID = 'vip-success-divider-gradient'

function getVipSuccessDividerColors(color?: VipSuccessDividerColor) {
  if (typeof color === 'string') {
    return {
      diamond: color,
      start: color,
      center: color,
      end: color,
    }
  }

  return {
    diamond: color?.diamond ?? '#F2CA91',
    start: color?.start ?? '#F2CA91',
    center: color?.center ?? '#F2CA91',
    end: color?.end ?? '#F2CA91',
  }
}

function VipSuccessDivider({ color }: { color?: VipSuccessDividerColor }) {
  const colors = getVipSuccessDividerColors(color)

  return (
    <svg
      width='327'
      height='10'
      viewBox='0 0 327 10'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className='mx-auto mb-[32px] mt-[20px] h-[10px] w-[327px]'
      aria-hidden='true'
    >
      <rect
        width='4'
        height='4'
        transform='matrix(0.707107 0.707107 0.707107 -0.707107 161.17 2.82812)'
        fill={colors.diamond}
        fillOpacity='0.7'
      />
      <path
        d='M0 3.00098H158L164 9.00098L170 3.00098H327'
        stroke={`url(#${VIP_SUCCESS_DIVIDER_GRADIENT_ID})`}
      />
      <defs>
        <linearGradient
          id={VIP_SUCCESS_DIVIDER_GRADIENT_ID}
          x1='0'
          y1='1.89598'
          x2='327'
          y2='1.89666'
          gradientUnits='userSpaceOnUse'
        >
          <stop stopColor={colors.start} stopOpacity='0' />
          <stop offset='0.499561' stopColor={colors.center} stopOpacity='0.7' />
          <stop offset='1' stopColor={colors.end} stopOpacity='0' />
        </linearGradient>
      </defs>
    </svg>
  )
}

export default function PaySuccessModal() {
  const {
    isOpenIapSuccess,
    setOpenIapSuccess,
    paySuccessInfo,
    vipSuccessModal,
    setVipSuccessModal,
    itemInfo,
  } = useCheckoutStore(
    useShallow((state) => ({
      vipSuccessModal: state.vipSuccessModal,
      setVipSuccessModal: state.setVipSuccessModal,
      isOpenIapSuccess: state.isOpenIapSuccess,
      setOpenIapSuccess: state.setOpenIapSuccess,
      paySuccessInfo: state.paySuccessInfo,
      itemInfo: state.itemInfo,
    }))
  )

  const { jumpOneLink } = useOneLink()

  const { userInfo, currentChapter } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      currentChapter: state.currentChapter,
    }))
  )

  const [isClosing, setIsClosing] = useState(false)
  const t = useTranslations()

  const { customEventReport } = useReport()

  // 自动关闭：显示 3 秒后切换到关闭动画，动画结束后再隐藏
  useEffect(() => {
    if (!isOpenIapSuccess) {
      return
    }
    setIsClosing(false)

    const autoTimer = setTimeout(() => setIsClosing(true), 2000)
    return () => clearTimeout(autoTimer)
  }, [isOpenIapSuccess])

  const vipModalChange = (open: boolean) => {
    setVipSuccessModal({
      open: open,
    })

    customEventReport('pay_popup', {
      _action: 'close',
      _chap_id: currentChapter?.chapter_id,
      _chap_order_id: currentChapter?.serial_number,
      popup_name: 'vip_pay_success',
    })
  }

  // 添加金币数量
  const addCoins = useMemo(() => {
    if (!paySuccessInfo) {
      return 0
    }
    return paySuccessInfo.addCoins
  }, [paySuccessInfo])

  const vipModalInfo = useMemo(() => {
    if (typeof window === 'undefined') {
      return null
    }
    const cachePopVipInfo =
      JSON.parse(localStorage.getItem(localKeyProduct) || 'false') || itemInfo
    if (!cachePopVipInfo) {
      return null
    }
    return cachePopVipInfo
  }, [paySuccessInfo, itemInfo])

  const title = useMemo(() => {
    if (vipSuccessModal.type === 1) {
      return vipModalInfo?.sub_success_popup?.title
    } else {
      return vipModalInfo?.vip_title
    }
  }, [vipModalInfo, vipSuccessModal.type])

  const handleGoAppClick = () => {
    jumpOneLink()
    customEventReport('pay_popup', {
      _action: 'goto_app_click',
      _chap_id: currentChapter?.chapter_id,
      _chap_order_id: currentChapter?.serial_number,
      popup_name: 'vip_pay_success',
    })
  }

  useEffect(() => {
    if (vipSuccessModal.open) {
      customEventReport('pay_popup', {
        _action: 'show',
        _chap_id: currentChapter?.chapter_id,
        _chap_order_id: currentChapter?.serial_number,
        popup_name: 'vip_pay_success',
      })
    }
  }, [vipSuccessModal.open, currentChapter?.chapter_id])

  /**
   * 金币弹框上报
   */
  useEffect(() => {
    if (isOpenIapSuccess) {
      customEventReport('pay_popup', {
        _action: 'show',
        _chap_id: currentChapter?.chapter_id,
        _chap_order_id: currentChapter?.serial_number,
        popup_name: 'coin_pay_success',
      })
    }
  }, [isOpenIapSuccess, currentChapter?.chapter_id])

  const benefits = useMemo(() => {
    if (!vipModalInfo) {
      return null
    }
    const list = vipModalInfo?.sub_success_popup?.benefits_list || []

    return (
      <Marquee speed={25}>
        {list.map((item: any, index: number) => {
          return (
            <div className='mx-[4px] h-[120px] w-[95px]' key={index}>
              <div className='flex h-[56px] w-full items-center justify-center'>
                <img className='h-[56px] w-[56px]' src={item.img} alt='' />
              </div>
              <div
                className='mt-[8px] text-center text-xs'
                style={{ color: siteConfig?.vipSuccessbenefitsTextColor }}
              >
                {item.name}
              </div>
            </div>
          )
        })}
      </Marquee>
    )
  }, [vipModalInfo])

  const validTime = useMemo(() => {
    const time = userInfo?.account?.vip_expire || paySuccessInfo?.vip_expire
    if (time) {
      return t('checkout.v-time', { date: formateDate(time) })
    }
    return ''
  }, [userInfo, t, paySuccessInfo])

  return (
    <>
      {(isOpenIapSuccess || isClosing) && (
        <div
          className={cn(
            'pointer-events-none fixed inset-0 z-40 flex items-center justify-center'
          )}
        >
          <div
            className={cn(
              'flex flex-col items-center justify-center rounded-[8px] bg-[#3D3D3D] p-6 text-sm text-white/90',
              'duration-500',
              isClosing
                ? 'animate-out fade-out slide-out-to-bottom-8'
                : 'animate-in fade-in slide-in-from-bottom-8'
            )}
            onAnimationEnd={() => {
              if (isClosing) {
                setOpenIapSuccess(false)
                setIsClosing(false)
              }
            }}
          >
            <div className='mb-[12px]'>
              <img
                className='h-[40px] w-[40px]'
                src={siteConfig?.coinIcon || ''}
                alt=''
              />
            </div>
            <div>
              +{addCoins} {t('checkout.coins')}
            </div>
          </div>
        </div>
      )}

      {/* VipSu modal */}
      <CustomerDrawer
        isOpen={vipSuccessModal.open}
        onOpenChange={vipModalChange}
        className='border-none p-0'
        zIndex={71}
      >
        <div
          className='relative rounded-tl-[16px] rounded-tr-[16px] pb-[24px]'
          style={{
            border: siteConfig?.vipSuccessBorder ?? '0.5px solid transparent',
            background: [
              siteConfig?.vipSuccessToplight
                ? `url(${siteConfig.vipSuccessToplight}) top center / 100% auto no-repeat padding-box`
                : undefined,
              siteConfig?.vipSuccessBg,
            ]
              .filter(Boolean)
              .join(', '),
          }}
        >
          <div
            className={cn(
              'absolute left-1/2 top-[-60px] ml-[-60px] transition-opacity duration-500',
              vipSuccessModal.open ? '' : 'opacity-0'
            )}
          >
            <Image
              src={siteConfig?.vipBigIcon || ''}
              alt='vip'
              width={120}
              height={120}
              className='w-120px] h-[120px]'
              unoptimized
            />
          </div>

          <div
            className='mt-[76px] w-full justify-center text-center text-base font-bold [text-shadow:_0px_1px_4px_rgb(77_38_6_/_1.00)]'
            style={{
              color: siteConfig?.vipSuccessTextColor1?.includes('gradient')
                ? 'transparent'
                : siteConfig?.vipSuccessTextColor1,
              backgroundImage: siteConfig?.vipSuccessTextColor1?.includes(
                'gradient'
              )
                ? siteConfig.vipSuccessTextColor1
                : undefined,
              WebkitBackgroundClip: siteConfig?.vipSuccessTextColor1?.includes(
                'gradient'
              )
                ? 'text'
                : undefined,
            }}
          >
            {title}
          </div>

          {vipSuccessModal.type == 2 ? (
            <div
              className='mt-2 flex items-center justify-center text-[12px]'
              style={{ color: siteConfig?.vipSuccessTextColor2 }}
            >
              <div>{t('checkout.subscribing')}</div>
              <div
                className='mx-2 h-[8px] w-[1px]'
                style={{ backgroundColor: siteConfig?.vipSuccessTextColor2 }}
              ></div>
              <div>{validTime}</div>
            </div>
          ) : null}
          <VipSuccessDivider color={siteConfig?.vipSuccessDividerColor} />

          {benefits}
          {vipSuccessModal.type == 2 && isReelshort() ? (
            <div
              className='mx-auto flex h-[48px] w-[327px] items-center justify-center rounded bg-white/10 text-sm font-bold'
              onClick={handleGoAppClick}
              style={{ color: siteConfig?.vipSuccessTextColor3 }}
            >
              {t('checkout.go-app')}
            </div>
          ) : null}
        </div>
      </CustomerDrawer>
    </>
  )
}
