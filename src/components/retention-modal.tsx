import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { Modal } from '@/components/dialog'
import { CloseIcon } from '@/components/ui/icons'
import { useReport } from '@/hooks/use-report'
import { storeOrderInfo } from '@/lib/checkout'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useI18n } from '@/i18n'
import { getSiteConfigClient } from '@/lib/config/site'

const COUNTDOWN_SECONDS = 5 * 60 // 5分钟

// 格式化倒计时为 MM:SS 格式
const formatCountdown = (seconds: number): { mins: string; secs: string } => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return {
    mins: mins.toString().padStart(2, '0'),
    secs: secs.toString().padStart(2, '0'),
  }
}

export default function RetentionModal() {
  const { t } = useI18n()
  const siteConfig = getSiteConfigClient()
  const {
    openRetentionModal,
    setOpenRetentionModal,
    setOpenMethodModal,
    discountPopupInfo,
    setItemInfo,
  } = useCheckoutStore(
    useShallow((state) => ({
      openRetentionModal: state.openRetentionModal,
      setOpenRetentionModal: state.setOpenRetentionModal,
      setOpenMethodModal: state.setOpenMethodModal,
      discountPopupInfo: state.discountPopupInfo,
      setItemInfo: state.setItemInfo,
    }))
  )

  const { customEventReport, payReport } = useReport()

  const [remaining, setRemaining] = useState(COUNTDOWN_SECONDS)
  const timerRef = useRef<number | null>(null)

  const { open, product } = openRetentionModal

  // 每次打开弹窗时重置倒计�?
  useEffect(() => {
    if (open) {
      if (window.$video) {
        window.$video.pause()
      }
      setRemaining(COUNTDOWN_SECONDS)

      console.log({ product })

      if (product) {
        //处理一下，保持和store_list 接口的数据一�?
        const data = {
          ...product,
          sub_success_popup: discountPopupInfo?.sub_success_popup,
          // 添加一个标识，表示是离开时弹出的
          is_leave: 1,
        }

        setItemInfo(data)
      }
      timerRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            if (timerRef.current) {
              clearInterval(timerRef.current)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)

      customEventReport('discount_popup_stat', {
        _action: 'show',
        popup_position: openRetentionModal.pos,
        discount_config_id: product?.identifier,
        _channel_sku: product?.product_id,
        screen_play_type: 0,
      })
    } else {
      // 关闭弹窗时清除定时器
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [open])

  /**
   * 格式化倒计�?
   */
  const displayTime = useMemo(() => formatCountdown(remaining), [remaining])

  /** 继续离开 */
  const handleContinue = () => {
    customEventReport('discount_popup_stat', {
      _action: 'close',
      popup_position: openRetentionModal.pos,
      discount_config_id: product?.identifier,
      screen_play_type: 0,
      _channel_sku: product?.product_id,
    })
    openRetentionModal.next?.() // 执行注册的回�?
    setOpenRetentionModal({
      open: false,
      next: undefined,
    })
  }

  const handleToPay = useCallback(() => {
    if (!product) {
      return
    }
    const { gid, product_id, identifier, promotion_price } = product

    setOpenMethodModal(true)
    storeOrderInfo({
      gid,
      product_id,
      discountId: identifier,
      amount: promotion_price,
      _order_src:
        openRetentionModal?.pos === 1
          ? 'back_discount_popup'
          : 'close_unlock_discount_popup',
    })
    customEventReport('discount_popup_stat', {
      _action: 'sku_click',
      popup_position: openRetentionModal?.pos,
      _channel_sku: product_id,
      discount_config_id: identifier,
      screen_play_type: 0,
    })

    payReport({
      eventName: 'product_click',
    })
  }, [openRetentionModal])

  if (!product) {
    return null
  }

  return (
    <Modal
      isOpen={open}
      onOpenChange={() => {
        setOpenRetentionModal({
          open: false,
        })
      }}
      className='border-none bg-transparent p-0 shadow-none'
    >
      <div
        className='relative h-[500px] w-full pt-[32px]'
        style={{
          background: siteConfig?.retentionModalBg
            ? `url(${siteConfig.retentionModalBg}) no-repeat center center/460px 500px`
            : undefined,
        }}
      >
        <div
          className='relative w-full text-center text-[24px] font-bold uppercase'
          style={{
            background:
              'linear-gradient(270deg, #F2CA91 7.51%, #FFF0DC 50.09%, #F2CA91 92.85%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {t('checkout.limited_time_offer')}

          <div className='absolute left-[50%] top-[10px] h-6 w-52 -translate-x-1/2 rounded-full bg-amber-300/40 blur-md'></div>
        </div>
        <div className='mt-[4px] flex w-full items-center justify-center text-[14px] text-[#FFF0DC]'>
          <div className='flex h-[22px] w-[22px] items-center justify-center rounded-[2px] bg-[#FFEDD7] text-[16px] font-bold leading-none text-[#532D17]'>
            {displayTime.mins}
          </div>
          <div className='mx-[4px] text-[16px] font-bold text-[#FFF0DC]'>:</div>
          <div className='flex h-[22px] w-[22px] items-center justify-center rounded-[2px] bg-[#FFEDD7] text-[16px] font-bold leading-none text-[#532D17]'>
            {displayTime.secs}
          </div>
        </div>
        <div className='absolute top-[135px] w-full'>
          <div className='w-full text-center text-base font-bold text-[#401A06E5]/90'>
            {t('checkout.weekly_vip')}
          </div>
          <div className='w-full text-center text-sm text-[#401A06E5]/90'>
            {t('checkout.all_free')}
          </div>
          <div className='mt-[20px] w-full text-center text-[40px] font-bold leading-none text-[#401A06E5]'>
            ${product?.promotion_price}
          </div>
          <div className='w-full text-center text-[16px] text-[#401A0680]/50 line-through'>
            ${product?.price}
          </div>
        </div>
        <div
          className='absolute bottom-[120px] left-1/2 flex h-[44px] w-[250px] -translate-x-1/2 items-center justify-center rounded-[4px] text-[16px] font-bold text-[#401A06E5]/90'
          onClick={handleToPay}
          style={{
            background: 'linear-gradient(266deg, #FFF0DC 10%, #F2CA91 100%)',
          }}
        >
          {t('checkout.subscribe_now')}
        </div>
        <div
          className='absolute bottom-[25px] left-1/2 -translate-x-1/2'
          onClick={handleContinue}
        >
          <CloseIcon />
        </div>
        <div className='flex gap-2'></div>
      </div>
    </Modal>
  )
}
