'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'

import {
  getOrderInfo,
  PAY_CHANNEL_ID,
  removeOrderInfo,
  storeOrderInfo,
  METHODS_INFO,
} from '@/lib/checkout'
import { pixelPurchase, pixelSubscribe } from '@/lib/pixel-event'
import { sessionKey } from '@/lib/constant'
import { servicesGetUserInfo } from '@/lib/services/login'
import { checkOrder, createOrder } from '@/lib/services/checkout'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'
import { useLoginStore } from '@/stores/login-store'

import { useReport } from './use-report'
import { armsPayReport } from '@/lib/arms'

export function useCheckout() {
  const { updateAccountInfo, userInfo, setUserInfo } = useDramaStore(
    useShallow((state) => ({
      updateAccountInfo: state.updateAccountInfo,
      userInfo: state.userInfo,
      setUserInfo: state.setUserInfo,
    }))
  )
  // 商城模式 iap 或者 vip ，其它为混合
  const storeMode = useSearchParams().get('h5mode') || ''
  // 是否混合
  const isMixPay = !['iap', 'vip'].includes(storeMode)

  const {
    openIapSuccess,
    setVipSuccessModal,
    closeAllPayModal,
    setPaySuccessInfo,
    openFailModal,
    setOpenAdyenModal,
    itemInfo,
    setGlobalLoading,
    setOpenRetentionModal,
    discountPopupInfo,
    googlePayInstance,
    applePayInstance,
  } = useCheckoutStore(
    useShallow((state) => ({
      openIapSuccess: state.setOpenIapSuccess,
      setVipSuccessModal: state.setVipSuccessModal,
      closeAllPayModal: state.closeAllPayModal,
      setPaySuccessInfo: state.setPaySuccessInfo,
      openFailModal: state.setOpenFailModal,
      setOpenAdyenModal: state.setOpenAdyenModal,
      itemInfo: state.itemInfo,
      setGlobalLoading: state.setGlobalLoading,
      setOpenRetentionModal: state.setOpenRetentionModal,
      discountPopupInfo: state.discountPopupInfo,
      applePayInstance: state.applePayInstance,
      googlePayInstance: state.googlePayInstance,
    }))
  )

  const setOpenLoginModal = useLoginStore((state) => state.setOpenLoginModal)

  const { payReport, currencyChangeReport, customEventReport } = useReport()
  const { id } = useParams() as { id: string }

  const itemInfoRef = useRef<any>(null)

  useEffect(() => {
    itemInfoRef.current = itemInfo
  }, [itemInfo])

  /** 失败 */
  const handleError = (error: any) => {
    setOpenAdyenModal(false)
    openFailModal(true)

    payReport({
      eventName: 'pay_failed',
      other: error,
    })
    removeOrderInfo()
  }

  /** 支付成功 */
  const handleSuccess = (data: any) => {
    const orderInfo = getOrderInfo()
    const { isSubscription, add_coins, add_bonus, chapter_id, chap_order_id } =
      orderInfo
    setPaySuccessInfo({
      addCoins: (add_coins || 0) + (add_bonus || 0),
      isSubscription,
      vip_expire: data?.account?.vip_expire,
    })

    closeAllPayModal()
    isSubscription
      ? setVipSuccessModal({
          open: true,
        })
      : openIapSuccess(true)

    const { coins = 0, bonus = 0 } = data?.account || {}
    updateAccountInfo({
      coins,
      bonus,
      vip_type: data?.account?.vip_type || 0,
      vip_sec: data?.account?.vip_sec || 0,
      vip_category: data?.account?.vip_category || 0,
    })

    armsPayReport('pay_complete')

    payReport({
      eventName: 'pay_complete',
    })

    if (userInfo.sid === 0) {
      setOpenLoginModal(true, 'pay_login_popup')
    }

    pixelPurchase({
      amount: data.amount,
      story_id: id,
    })

    // fb 订阅周卡上报
    if (data.account.vip_type === 1) {
      pixelSubscribe({
        amount: data.amount,
        story_id: id,
      })
    }

    if (!isSubscription) {
      //金币变化埋点（coins）
      currencyChangeReport({
        _vc_id: 'vc_01',
        _change_amount: add_coins,
        _latter_amount: data.coins,
        _change_reason: 'pay_get',
        _chap_id: chapter_id,
        _chap_order_id: chap_order_id,
      })

      currencyChangeReport({
        _vc_id: 'vc_02',
        _change_amount: add_bonus,
        _latter_amount: data.bonus,
        _change_reason: 'recharge_gift_get',
        _chap_id: chapter_id,
        _chap_order_id: chap_order_id,
      })
    }
    if (userInfo.uid) {
      servicesGetUserInfo(Number(userInfo.uid)).then((res) => {
        if (res?.code === 0 && res?.data?.user_info) {
          const session = localStorage.getItem(sessionKey) || ''
          setUserInfo(
            {
              ...res.data.user_info,
              subscribe_entrance: res.data.subscribe_entrance,
            },
            session
          )
        }
      })
    }
    removeOrderInfo()
  }

  /** 创建订单，跳站外类型 */
  const handleCreateOrder = async ({
    channel,
    subChannel = '',
    extraParams = {},
  }: {
    channel: string
    subChannel?: string
    extraParams?: any
  }) => {
    const itemInfo = itemInfoRef.current
    if (!itemInfo) {
      return
    }
    setGlobalLoading(true)

    const { gid, identifier = '' } = itemInfo
    const currentUrl = window.location.href

    const paypalCancelUrl = currentUrl.includes('?')
      ? `${currentUrl}&cancel=1`
      : `${currentUrl}?cancel=1`

    const baseParams: any = {
      [PAY_CHANNEL_ID.PAYPAL]: {
        payType: 1,
        return_url: currentUrl,
        cancel_url: paypalCancelUrl,
      },
      [PAY_CHANNEL_ID.PAYERMAX]: {
        payType: 66,
        return_url: `${currentUrl}&pm_back=1`,
      },
    }

    try {
      const res = await createOrder({
        gid,
        amount: 0,
        if_renewal: 1,
        identifier,
        third_discount_disable: 1,
        ...baseParams[channel],
        ...extraParams,
      })

      const { data, code } = res

      if (code !== 0 || data.status !== 1) {
        handleError({
          _err_code: code || '',
          _err_info: data?.message || '',
        })
        return
      }

      const { order_id, merchant_order_id } = data

      storeOrderInfo({
        add_coins: itemInfo.coins || 0,
        add_bonus: itemInfo.bonus || 0,
        order_id,
        merchant_order_id,
        pay_channel: channel,
        pay_channel_sub_class: subChannel,
        isSubscription: itemInfo.vip_type > 0,
      })
      payReport({ eventName: 'pay_start' }, true)

      // 跳转支付链接
      if (data?.paymentLink) {
        window.location.href = data.paymentLink
      }
      // paypal 用的是这个字段
      if (data?.approve_link) {
        window.location.href = data.approve_link
      }
      setTimeout(() => {
        setGlobalLoading(false)
      }, 5000)
    } catch (e: any) {
      handleError({
        _err_info: e?.message || '',
      })
    }
  }

  // checkout order
  const checkoutOrder = useCallback(async (params: any) => {
    payReport({
      eventName: 'pay_end',
    })
    try {
      const res: any = await checkOrder(params)
      const { code, data } = res
      const success = code === 0 && (data.status === 1 || data.status == 3)
      console.log('check-order', res)
      if (success) {
        handleSuccess(data)
      } else {
        handleError({
          _err_code: code || '',
          _err_info: data?.message || '',
        })
      }
    } catch (error: any) {
      handleError({
        _err_info: error?.message || error || '',
      })
    }
  }, [])

  /** 挽留弹窗 */
  const handleRetention = useCallback(
    (ext: { next?: () => void; pos: number }) => {
      const { pos } = ext

      const productInfo =
        pos === 1
          ? discountPopupInfo?.exit_player
          : discountPopupInfo?.close_unlock_panel

      if (!productInfo) {
        ext.next?.()
        return
      }

      setOpenRetentionModal({
        open: true,
        product: productInfo,
        next: ext.next,
        pos,
      })
    },
    [discountPopupInfo]
  )

  /**
   * adyen组件 苹果谷歌支付
   */
  const adyenAppleGooglePay = useCallback(
    (type: 'applepay' | 'googlepay') => {
      const instance =
        type === 'applepay' ? applePayInstance : googlePayInstance
      if (!instance) return
      const itemInfo = itemInfoRef.current
      const price = itemInfo?.promotion_price || itemInfo?.price || '0'
      instance.update({
        amount: {
          value: Math.round(Number(price) * 100),
          currency: 'USD',
        },
      })
      instance.submit()
    },
    [applePayInstance, googlePayInstance]
  )

  /**
   * 支付处理函数
   * @parmas
   * key: 支付方式
   */
  const payHandler = useCallback(
    (key: string) => {
      switch (true) {
        case key === 'applepay' || key === 'googlepay':
          adyenAppleGooglePay(key)
          break
        case key === 'paypal':
          handleCreateOrder({
            channel: PAY_CHANNEL_ID.PAYPAL,
          })
          break
        case key === 'card':
          setOpenAdyenModal(true)
          break
        case key.startsWith('PAYERMAX'):
          const methodInfo = METHODS_INFO[key] || {}
          handleCreateOrder({
            channel: PAY_CHANNEL_ID.PAYERMAX,
            subChannel: `${methodInfo.subChannel || ''}`,
            extraParams: {
              checusMethodType: methodInfo.methodType,
              checusTargetOrg: methodInfo.targetOrg,
            },
          })
          break
        default:
          break
      }
    },
    [adyenAppleGooglePay]
  )

  return {
    isMixPay,
    storeMode,
    payHandler,
    checkoutOrder,
    handleRetention,
  }
}
