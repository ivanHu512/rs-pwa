'use client'
import { ApplePay, GooglePay } from '@adyen/adyen-web'
import { useDocumentVisibility } from 'ahooks'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { useEffect, useMemo, useRef } from 'react'
import { useShallow } from 'zustand/shallow'

import { useCheckout } from '@/hooks/use-checkout'
import { useReport } from '@/hooks/use-report'
import { CARD_ICON, getPaymentList, METHODS_INFO } from '@/lib/checkout'
import { useCheckoutStore } from '@/stores/checkout-store'
import Drawer from '@/components/ui/custom-drawer'

export default function Methods() {
  const t = useTranslations()
  const {
    adyenCheckout,
    itemInfo,
    isOpenMethodModal,
    openMethodModal,
    applePayInstance,
    googlePayInstance,
    setApplePayInstance,
    setGooglePayInstance,
    payerMaxData,
  } = useCheckoutStore(
    useShallow((state) => ({
      setOpenAdyenModal: state.setOpenAdyenModal,
      adyenCheckout: state.adyenCheckout,
      itemInfo: state.itemInfo,
      isOpenMethodModal: state.isOpenMethodModal,
      openMethodModal: state.setOpenMethodModal,
      openPayModal: state.openPayModal,
      setGlobalLoading: state.setGlobalLoading,
      setOpenPayModal: state.setOpenPayModal,
      applePayInstance: state.applePayInstance,
      googlePayInstance: state.googlePayInstance,
      setApplePayInstance: state.setApplePayInstance,
      setGooglePayInstance: state.setGooglePayInstance,
      payerMaxData: state.payerMaxData,
    }))
  )
  const { payHandler } = useCheckout()
  const { payReport } = useReport()
  const documentVisibility = useDocumentVisibility()

  const googleContainerRef = useRef(null)
  const appleContainerRef = useRef(null)

  const itemInfoRef = useRef(itemInfo)

  useEffect(() => {
    itemInfoRef.current = itemInfo
  }, [itemInfo])

  useEffect(() => {
    if (!adyenCheckout) {
      return
    }
    if (!googleContainerRef.current || !appleContainerRef.current) {
      return
    }
    if (googlePayInstance) {
      googlePayInstance.unmount()
      setGooglePayInstance(null)
    }
    if (applePayInstance) {
      applePayInstance.unmount()
      setApplePayInstance(null)
    }
    console.log('init google apple pay')
    const googlePay = new GooglePay(adyenCheckout, {
      showPayButton: false,
    })
    googlePay.isAvailable().then(() => {
      googlePay.mount(googleContainerRef.current!)
      setGooglePayInstance(googlePay)
    })
    const applePay = new ApplePay(adyenCheckout, {
      requiredBillingContactFields: ['email'],
      requiredShippingContactFields: ['name', 'email'],
      showPayButton: false,
    })

    if (process.env.NEXT_PUBLIC_APP_ENV !== 'development') {
      // 开发环境就不加载了， 使用不了会报错
      applePay.isAvailable().then(() => {
        applePay.mount(appleContainerRef.current!)
        setApplePayInstance(applePay)
      })
    }
  }, [adyenCheckout, setApplePayInstance, setGooglePayInstance])

  useEffect(() => {
    if (documentVisibility === 'visible') {
      //修复社媒或者pwa里后退之后谷歌支付蒙层没有关闭
      const grayPane = document.querySelector('gpay-graypane')
      if (grayPane) {
        window.location.reload()
      }
    }
  }, [documentVisibility])

  const handleMethodClick = (payType: string) => {
    const { channel, subChannel = '' } = METHODS_INFO[payType] || {}
    payHandler(payType)
    payReport({
      eventName: 'pay_channel_choose',
      other: {
        pay_channel_sub_class: subChannel,
        pay_channel: channel,
      },
    })
  }

  useEffect(() => {
    if (isOpenMethodModal) {
      payReport({
        eventName: 'pay_channel_choose_show',
      })
    }
  }, [isOpenMethodModal])

  useEffect(() => {
    return () => {
      openMethodModal(false)
    }
  }, [])

  const renderPayMethods = useMemo(() => {
    console.log({ isOpenMethodModal, payerMaxData, itemInfo })
    if (!itemInfo || !payerMaxData || !isOpenMethodModal) return null

    const paymentList = getPaymentList(payerMaxData, 'vip')

    const TEXT_ICON_KEYS = new Set([
      'PAYERMAX_QUICK_PAY',
      'PAYERMAX_BANK_TRANSFER',
      'PAYERMAX_BANK_TRANSFER_BANKTRANSFER',
    ])

    return paymentList.map((key) => {
      const { name: originalName, icon2 } = METHODS_INFO[key] || {}
      const isCard = ['card', 'PAYERMAX_CARD'].includes(key)
      const country = payerMaxData.country

      let name = TEXT_ICON_KEYS.has(key) ? t(originalName) : originalName
      let cardIcon = CARD_ICON.rightIcon

      if (isCard) {
        name = t('checkout.cards')
        if (['jp', 'kr', 'mx'].includes(country)) {
          cardIcon = CARD_ICON.rIcon_jcb
        }
      }
      return (
        <div
          key={key}
          id={key}
          className='flex items-center border-b border-white/10 py-4 text-sm text-white/90 last:border-b-0'
          onClick={() => {
            handleMethodClick(key)
          }}
        >
          {icon2 && (
            <Image
              src={icon2}
              alt=''
              className='mr-2'
              unoptimized
              height={24}
              width={40}
            />
          )}
          {name}
          {isCard && (
            <img className='ml-auto h-[20px] w-auto' src={cardIcon} alt='' />
          )}
        </div>
      )
    })
  }, [itemInfo?.gid, payerMaxData, isOpenMethodModal, t])

  return (
    <>
      {/* preload */}
      {adyenCheckout && (
        <div className='invisible z-[-1] h-[0px] overflow-hidden'>
          <div ref={googleContainerRef}></div>
          <div ref={appleContainerRef}></div>
          <img
            src={METHODS_INFO['applepay'].icon2}
            width={40}
            height={24}
            alt=''
          />
          <img
            src={METHODS_INFO['googlepay'].icon2}
            width={40}
            height={25}
            alt=''
          />
          <img src={METHODS_INFO['card'].icon2} width={40} height={25} alt='' />
          <img
            src={METHODS_INFO['paypal'].icon2}
            width={40}
            height={25}
            alt=''
          />
        </div>
      )}
      <Drawer
        open={isOpenMethodModal}
        className='p-4'
        onClose={() => {
          openMethodModal(false)
        }}
        zIndex={65}
      >
        <div className='mb-4 text-base font-bold'>
          {t('checkout.pay-method')}
        </div>
        <div className='flex w-full flex-col rounded bg-[#292929] px-4'>
          <>{renderPayMethods}</>
        </div>
      </Drawer>
    </>
  )
}
