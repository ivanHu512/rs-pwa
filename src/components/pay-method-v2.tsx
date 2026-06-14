import { CARD_ICON, METHODS_INFO, getPaymentList } from '@/lib/checkout'
import { useCheckoutStore } from '@/stores/checkout-store'
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useI18n } from '@/i18n'
import { cn } from '@/lib/utils'
import { UIArrowsDown } from './ui/icons'
import { useCheckout } from '@/hooks/use-checkout'
import { useReport } from '@/hooks/use-report'

function PayMethodV2() {
  const { t } = useI18n()
  const [isExpanded, setIsExpanded] = useState(false)
  const { reportPayChannelChooseStat } = useReport()

  const { itemInfo, selectedMethod, setSelectedMethod, payerMaxData } =
    useCheckoutStore(
      useShallow((state) => ({
        itemInfo: state.itemInfo,
        selectedMethod: state.selectedMethod,
        setSelectedMethod: state.setSelectedMethod,
        payerMaxData: state.payerMaxData,
        openPayModal: state.openPayModal,
      }))
    )

  const { storeMode, isMixPay } = useCheckout()
  //当前是否vip
  const isVipRef = useRef(false)

  /** 生成支付列表 */
  const paymentList = useMemo(() => {
    // 混合模式下，必须先选择了商�?
    if (isMixPay && !itemInfo) return []

    // 混合模式下，根据商品类型判断�?非混合模式下，根�?浏览器参�?storeMode 判断
    const storeType = isMixPay
      ? itemInfo!.vip_type > 0
        ? 'vip'
        : 'iap'
      : storeMode
    isVipRef.current = storeType === 'vip'

    return getPaymentList(payerMaxData, storeType as 'iap' | 'vip')
  }, [payerMaxData, itemInfo, storeMode, isMixPay])

  /** 选中支付方式 */
  const handleSelecteMethod = useCallback(
    (key: string) => {
      const { icon = '', channel, subChannel } = METHODS_INFO[key] || {}
      setSelectedMethod({
        type: key,
        icon: icon,
      })
      reportPayChannelChooseStat({
        _action: 'click',
        pay_channel: channel,
        pay_channel_sub_class: subChannel || '',
        channel_sku: itemInfo?.product_id,
      })
    },
    [setSelectedMethod, itemInfo]
  )

  /** 展开&收起更多支付方式 */
  const handleExpand = useCallback(() => {
    setIsExpanded(!isExpanded)
  }, [isExpanded])

  useEffect(() => {
    if (isExpanded) {
      reportPayChannelChooseStat({
        _action: 'more_click',
        channel_sku: itemInfo?.product_id,
      })

      const show_list = paymentList.slice(4).map((key) => {
        const { channel = '', subChannel = '' } = METHODS_INFO[key] || {}
        return {
          pay_channel: channel,
          pay_channel_sub_class: subChannel,
        }
      })

      reportPayChannelChooseStat({
        _action: 'show',
        show_list,
        channel_sku: itemInfo?.product_id,
      })
    }
  }, [isExpanded])

  useEffect(() => {
    if (!paymentList.length) return

    const isExist = selectedMethod && paymentList.includes(selectedMethod.type)
    // 如果没选或者因为切换后不存在支付方式，自动选择第一�?
    if (!isExist) {
      handleSelecteMethod(paymentList[0])
    }
  }, [paymentList, selectedMethod, handleSelecteMethod])

  const renderPayMethod = useMemo(() => {
    if (!paymentList.length || !payerMaxData) {
      return null
    }

    const { country } = payerMaxData

    const displayList = isExpanded ? paymentList : paymentList.slice(0, 4)

    const TEXT_ICON_KEYS = new Set([
      'PAYERMAX_QUICK_PAY',
      'PAYERMAX_BANK_TRANSFER',
      'PAYERMAX_BANK_TRANSFER_BANKTRANSFER',
    ])

    return (
      <div className='flex flex-col gap-3'>
        <div className='grid grid-cols-2 gap-2'>
          {displayList.map((key) => {
            const methodInfo = METHODS_INFO[key]
            const isTextIconMode = TEXT_ICON_KEYS.has(key)

            let icon = isTextIconMode
              ? methodInfo?.payIcon || ''
              : methodInfo?.icon || ''

            const isSelected = selectedMethod?.type === key

            // 这几个国家card的图标不一�?
            if (key === 'card') {
              if (['jp', 'kr', 'mx'].includes(country)) {
                icon = CARD_ICON.jcb
              }
            } else if (key === 'PAYERMAX_CARD' && country !== 'br') {
              icon = CARD_ICON.visa
            } else if (
              isVipRef.current &&
              key === 'PAYERMAX_CARD' &&
              country === 'br'
            ) {
              icon = CARD_ICON.visa
            }

            const content = (
              <>
                <img
                  src={icon}
                  alt=''
                  className='h-4 w-auto'
                />
                {isTextIconMode && (
                  <span className='ml-1 text-[12px] font-bold'>
                    {t(methodInfo?.name)}
                  </span>
                )}
              </>
            )

            return (
              <div
                key={key}
                id={key}
                className={cn(
                  'flex h-10 w-full items-center justify-center text-ellipsis rounded bg-[#292929] text-xs transition-all',
                  isSelected &&
                    'ring-1 ring-white ring-offset-2 ring-offset-[#141414]'
                )}
                onClick={() => {
                  handleSelecteMethod(key)
                }}
              >
                {content}
              </div>
            )
          })}
        </div>
        {paymentList.length > 4 && (
          <div
            className='flex w-full items-center justify-center py-2 text-sm text-white/60 transition-colors'
            onClick={handleExpand}
          >
            <span className='mr-1'>
              {isExpanded
                ? t('checkout.collapse')
                : t('checkout.more-payment-method')}
            </span>
            <UIArrowsDown
              className={cn(
                'text-[12px] transition-transform duration-300',
                isExpanded ? 'rotate-180' : 'rotate-0'
              )}
            />
          </div>
        )}
      </div>
    )
  }, [
    paymentList,
    selectedMethod,
    handleSelecteMethod,
    isExpanded,
    t,
    payerMaxData,
  ])

  /**
   * 支付方式列表上报
   */
  useEffect(() => {
    if (!paymentList.length) {
      return
    }
    // 触发挽留弹窗后itemInfo会变化，导致多上报了一次，通过标识过滤�?
    if (itemInfo?.is_leave) {
      return
    }
    // 根据展开状态上报支持方式列�?
    const show_list = (isExpanded ? paymentList : paymentList.slice(0, 4)).map(
      (key) => {
        const { channel = '', subChannel = '' } = METHODS_INFO[key] || {}
        return {
          pay_channel: channel,
          pay_channel_sub_class: subChannel,
        }
      }
    )
    reportPayChannelChooseStat({
      _action: 'show',
      show_list,
      channel_sku: itemInfo?.product_id,
    })
  }, [paymentList, itemInfo])

  /** loading */
  const renderLoading = useMemo(() => {
    return (
      <div className='grid grid-cols-2 gap-2'>
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className='flex h-10 w-full animate-pulse rounded bg-[#292929]'
          ></div>
        ))}
      </div>
    )
  }, [])

  return (
    <div className='pb-4'>
      <div className='mb-3 mt-6 text-base font-bold'>
        {t('checkout.pay-method')}
      </div>
      {!paymentList.length ? renderLoading : renderPayMethod}
    </div>
  )
}

export default memo(PayMethodV2)
