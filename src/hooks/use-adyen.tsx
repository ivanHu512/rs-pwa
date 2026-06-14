'use client'
import {
  AdyenCheckout,
  CoreConfiguration,
  PaymentCompletedData,
  SubmitActions,
  SubmitData,
  UIElement,
  UIElementProps,
} from '@adyen/adyen-web'
import { useLocale } from 'next-intl'
import { useEffect, useRef } from 'react'

import {
  getOrderInfo,
  isPayRedirectBack,
  PAY_CHANNEL_ID,
  resetUrl,
  storeOrderInfo,
} from '@/lib/checkout'
import { localsMap, PAYMENT_RESULT } from '@/lib/constant'
import { adyenPaymentsCheck, createOrder } from '@/lib/services/checkout'
import translations from '@/lib/translations.json'
import { encrypt } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'
import { IProduct } from '@/types'
import { getSiteConfigClient } from '@/lib/config/site'

import { useCheckout } from './use-checkout'
import { useReport } from './use-report'

export function useAdyen() {
  const {
    itemInfo,
    adyenMethods,
    setAdyenCheckout,
    setGlobalLoading,
    setOpenFailModal,
    setOpenAdyenModal,
  } = useCheckoutStore()
  const locale = useLocale()
  const { payReport } = useReport()
  const { checkoutOrder } = useCheckout()

  const itemRef = useRef<IProduct | undefined>(undefined)

  useEffect(() => {
    itemRef.current = itemInfo
  }, [itemInfo])

  useEffect(() => {
    async function initCheckout() {
      if (!adyenMethods) {
        return
      }
      console.log('adyen init')

      const { paymentMethods, storedPaymentMethods, country_code } =
        adyenMethods

      const siteConfig = getSiteConfigClient()

      const config: CoreConfiguration = {
        clientKey: siteConfig?.adyen?.clientKey,
        environment: siteConfig?.adyen?.env as CoreConfiguration['environment'],
        locale: localsMap[locale],
        translations: translations,
        paymentMethodsResponse: {
          paymentMethods,
          storedPaymentMethods,
        },
        countryCode: country_code,
        onSubmit: (...args) => onSubmit(...args),
        onPaymentCompleted: (...args) => onPaymentCompleted(...args),
        /**
         * 额外操作比如二维码会调用下面方法
         * 3ds校验在当前页面处理也会触发，但是我设置了3ds是打开新页面的形式，所以也不会触发
         * @param state
         * @param component
         */
        onAdditionalDetails: async (state) => {
          console.log('onAddition', state)
        },
      }

      try {
        const checkoutInstance = await AdyenCheckout(config)
        setAdyenCheckout(checkoutInstance)
      } catch {
        return
      }
    }

    initCheckout()
  }, [adyenMethods])

  /** 重定向后的checkorder */
  useEffect(() => {
    const { isAdyen, redirectResult } = isPayRedirectBack()

    async function checkoutAdyenRedirect() {
      const orderInfo = getOrderInfo()
      if (isAdyen && orderInfo) {
        resetUrl()
        setGlobalLoading(true)
        sessionStorage.setItem('isRedirectPayBack', '1')

        const check_params = await encrypt(orderInfo.check_params)
        const params = {
          order_id: orderInfo.order_id,
          details: JSON.stringify({
            redirectResult,
          }),
          check_params,
        }
        try {
          const { code, data, msg } = await adyenPaymentsCheck(params)
          console.log('PaymentsCheck', data)
          if (code === 0 && data.result_code === PAYMENT_RESULT.AUTHORISED) {
            const checkOrderParam: any = {
              order_id: data.order_id,
              merchant_order_id: data.merchant_order_id,
              order_status: data.status,
              adyen_details: await encrypt(
                JSON.stringify({
                  result_code: data.result_code,
                })
              ),
            }
            storeOrderInfo({
              merchant_order_id: data.merchant_order_id,
            })
            await checkoutOrder(checkOrderParam)
          } else {
            onRedirectCheckFail({
              _err_code: code,
              _err_info: data?.result_code || msg,
            })
          }
        } catch (e: any) {
          onRedirectCheckFail(e)
        }
      }
    }

    checkoutAdyenRedirect()
  }, [])

  function onRedirectCheckFail(err = {}) {
    payReport({ eventName: 'pay_failed', other: err })
    setOpenFailModal(true)
  }

  const onSubmit = async (
    state: SubmitData,
    component: UIElement,
    actions: SubmitActions
  ) => {
    try {
      const itemInfo = itemRef.current
      if (!itemInfo) {
        return
      }

      const { gid, identifier = '' } = itemInfo

      const { brand, storedPaymentMethodId, type, googlePayCardNetwork } =
        state.data.paymentMethod

      // 卡片的是传brand
      let subChannel = type === 'scheme' ? brand : type

      if (type === 'googlepay') {
        subChannel = `${type}#${googlePayCardNetwork}`
      }

      storeOrderInfo({
        add_coins: itemInfo.coins || 0,
        add_bonus: itemInfo.bonus || 0,
        pay_channel: PAY_CHANNEL_ID.ADYEN,
        is_historical_card_payment: storedPaymentMethodId ? 1 : 0,
        pay_channel_sub_class: subChannel,
        isSubscription: itemInfo.vip_type > 0,
      })

      payReport({
        eventName: 'pay_start',
      })

      const result = await createOrder({
        payType: 99,
        return_url: location.href,
        gid,
        if_renewal: 1,
        //折扣ID
        identifier,
        currency: 'USD',
        amount: 0,
        // 不走优惠
        third_discount_disable: 1,
        adyen_params: JSON.stringify({
          paymentMethod: state.data.paymentMethod,
          browserInfo: state.data.browserInfo,
          origin: window.location.href,
          riskData: state.data.riskData,
          countryCode: 'US',
          returnUrl: window.location.href,
          storePaymentMethod: state.data.storePaymentMethod,
        }),
      })
      const { data } = result
      const { adyen_result_code, order_id, merchant_order_id, adyen_action } =
        data

      if (order_id && adyen_result_code) {
        storeOrderInfo({
          order_id,
          merchant_order_id,
          adyen_result_code,
        })
      } else {
        onSubmitFail(component, actions)
        return
      }
      actions.resolve({
        resultCode: adyen_result_code,
        order: merchant_order_id,
        action: adyen_action,
      })
    } catch (error: any) {
      onSubmitFail(component, actions)
    }
  }

  const onSubmitFail = (component: any, actions: any) => {
    setOpenFailModal(true)
    setOpenAdyenModal(false)
    payReport({ eventName: 'pay_failed' })
    component.setElementStatus('ready')
    actions.reject()
  }

  const onPaymentCompleted = async (
    result: PaymentCompletedData,
    component?: UIElement<UIElementProps>
  ) => {
    const { resultCode } = result
    const orderInfo = getOrderInfo()

    if (resultCode === 'Pending') {
      payReport({
        eventName: 'pay_pending',
      })
      component?.setElementStatus('ready')
      return
    }
    if (orderInfo && resultCode === PAYMENT_RESULT.AUTHORISED) {
      setGlobalLoading(true)
      const adyen_details = await encrypt(
        JSON.stringify({ result_code: resultCode })
      )

      await checkoutOrder({
        adyen_details,
        order_id: orderInfo.order_id, //	订单id
        merchant_order_id: orderInfo.merchant_order_id, //	三方订单
      })

      component?.setElementStatus('ready')
      return
    }

    setOpenFailModal(true)

    payReport({
      eventName: 'pay_failed',
    })
    component?.setElementStatus('ready')
  }
}
