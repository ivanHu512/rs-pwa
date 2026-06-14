'use client'
import { useParams, useSearchParams } from 'next/navigation'
import { useI18n } from '@/i18n'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import Adyen from '@/components/adyen'
import PayMethods from '@/components/pay-methods'
import Drawer from '@/components/ui/custom-drawer'
import { FailIcon } from '@/components/ui/icons'
import { useAdyen } from '@/hooks/use-adyen'
import { useCheckout } from '@/hooks/use-checkout'
import useFeedback from '@/hooks/use-feedback'
import { useReport } from '@/hooks/use-report'
import { useRsRequest } from '@/hooks/use-request'
import {
  getOrderInfo,
  isPayRedirectBack,
  METHODS_INFO,
  resetUrl,
  storeOrderInfo,
} from '@/lib/checkout'
import {
  getSiteConfigClient,
  siteButtonBgStyle,
  siteButtonOverlayStyle,
  isReelshort,
} from '@/lib/config/site'
import { pixelCompleteRegistration } from '@/lib/pixel-event'
import { cn, getH5mode } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'
import type { IProduct } from '@/types'
import PayButton from '../pay-button'
import PayMethodV2 from '../pay-method-v2'
import ProductItem from '../product-item'
import VipList from '../vip-list'
interface TextWithLinksProps {
  text?: string
  linkClassName?: string
  onClickLink: () => void
}

const TextWithLinks: React.FC<TextWithLinksProps> = ({
  text,
  linkClassName = 'text-white underline',
  onClickLink,
}) => {
  if (!text) return null
  if (!isReelshort()) return text
  const parts = text.split(/(<<([^<>]+)>>)/g)
  const elements: React.ReactNode[] = []

  for (let i = 0; i < parts.length; i++) {
    if (i % 3 === 1) {
      const label = parts[i + 1]?.trim()
      elements.push(
        <a className={linkClassName} onClick={onClickLink}>
          {label}
        </a>
      )
      i++
    } else if (parts[i]) {
      elements.push(parts[i])
    }
  }

  return <>{elements}</>
}

const renderTipsWithLinks = (text?: string) => {
  if (!text) {
    return null
  }

  const nodes: React.ReactNode[] = []
  const linkReg = /<<([^<>]+)>>+/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkReg.exec(text))) {
    const [fullText, label] = match

    if (match.index > lastIndex) {
      nodes.push(text.slice(lastIndex, match.index))
    }

    nodes.push(
      <a key={`${label}-${match.index}`} className='text-white underline'>
        {label}
      </a>
    )

    lastIndex = match.index + fullText.length
  }

  if (lastIndex < text.length) {
    nodes.push(text.slice(lastIndex))
  }

  return nodes
}

export default function PayModal() {
  const {
    openPayModal,
    setOpenPayModal,
    setAdyenMethods,
    setItemInfo,
    isOpenFailModal,
    openFailModal,
    setGlobalLoading,
    setDiscountPopupInfo,
    setPayerMaxData,
    itemInfo,
    selectedMethod,
  } = useCheckoutStore(
    useShallow((state) => ({
      openPayModal: state.openPayModal,
      setOpenPayModal: state.setOpenPayModal,
      setAdyenMethods: state.setAdyenMethods,
      setItemInfo: state.setItemInfo,
      isOpenFailModal: state.isOpenFailModal,
      openFailModal: state.setOpenFailModal,
      setGlobalLoading: state.setGlobalLoading,
      itemInfo: state.itemInfo,
      setDiscountPopupInfo: state.setDiscountPopupInfo,
      discountPopupInfo: state.discountPopupInfo,
      selectedMethod: state.selectedMethod,
      setPayerMaxData: state.setPayerMaxData,
    }))
  )

  const { payReport, customEventReport } = useReport()
  const { checkoutOrder, handleRetention, payHandler, isMixPay } = useCheckout()
  const { getFeedbackUrl } = useFeedback()
  const { t } = useI18n()
  const store_type = useSearchParams().get('store_type') || ''
  const { id } = useParams()
  const siteConfig = getSiteConfigClient()
  const [data, setData] = useState<any>([])

  //初始化adyen
  useAdyen()

  const { accountInfo, chapter } = useDramaStore(
    useShallow((state) => ({
      accountInfo: state.accountInfo,
      chapter: state.currentChapter,
    }))
  )

  useRsRequest({
    api: '/api/video/payment/getPaymentMethodAdyen',
    params: {
      channel: 'Web',
      amount: 300,
    },
    onSuccess: (res) => {
      console.log({ res })
      if (res.code === 0) {
        // 过滤 paymentMethods，只保留 type �?'googlepay'�?applepay' �?'scheme' 的对�?
        const filteredPaymentMethods =
          res.data?.paymentMethods?.filter(
            (method: any) =>
              method.type === 'googlepay' ||
              method.type === 'applepay' ||
              method.type === 'scheme'
          ) || []

        // 重新组装数据
        const filteredData = {
          ...res.data,
          paymentMethods: filteredPaymentMethods,
        }

        setAdyenMethods(filteredData)
      }
    },
  })

  useRsRequest({
    api: '/api/video/store/getStoreListV4',
    params: {
      store_type,
      h5mode: getH5mode() || '',
    },
    onSuccess(res) {
      if (res.code === 0) {
        setData(res.data)
      }
    },
  })

  useRsRequest({
    api: '/api/video/store/getH5DiscountPopupV2',
    params: {
      h5mode: getH5mode() || '',
    },
    dep: [accountInfo?.coins, accountInfo?.vip_type],
    onSuccess: (res) => {
      if (res.code === 0) {
        setDiscountPopupInfo(res.data)
      }
    },
  })

  // 获取payermax 支付方式
  useRsRequest({
    api: '/api/video/store/getH5PayWays',
    params: {
      // test_country: 'br',
    },
    onSuccess: (res) => {
      if (res.code === 0) {
        setPayerMaxData(res.data)
      }
    },
  })

  useEffect(() => {
    if (!openPayModal) {
      return
    }
    storeOrderInfo({
      _order_src: 'chap_fast_pay',
    })
    if (chapter) {
      payReport({
        eventName: 'pay_show',
      })
      if (!sessionStorage.getItem('pixel_complete_registration')) {
        pixelCompleteRegistration({
          story_id: id as string,
        })
        sessionStorage.setItem('pixel_complete_registration', 'true')
      }
    }
  }, [openPayModal, chapter])

  const handleSelectProduct = useCallback(
    (product: IProduct, isDefault = false) => {
      if (!chapter) {
        return
      }

      setItemInfo(product)

      storeOrderInfo({
        gid: product.gid,
        product_id: product.product_id,
        chapter_id: chapter.chapter_id,
        chap_order_id: chapter.serial_number || 0,
        discountId: product.identifier || '',
        t_book_id: chapter.t_book_id || '',
        amount: product.promotion_price || product.price || '0',
      })

      if (!isMixPay) {
        // 非混�?
        if (!selectedMethod) {
          return
        }
        const { type } = selectedMethod
        const { channel, subChannel = '' } = METHODS_INFO[type] || {}

        payReport({
          eventName: 'product_click',
          other: {
            pay_channel_sub_class: subChannel,
            pay_channel: channel,
            is_auto_click: isDefault ? 1 : 0,
          },
        })
        setTimeout(() => {
          payHandler(type)
        }, 10)
      } else {
        // 混合
        payReport({
          eventName: 'product_click',
          other: {
            is_auto_click: isDefault ? 1 : 0,
          },
        })
      }
    },
    [chapter, selectedMethod, isMixPay]
  )

  /** 默认选中第一个商�?*/
  useEffect(() => {
    if (!data || !openPayModal || !isMixPay) {
      return
    }
    const { vip_list, list } = data
    if (vip_list?.length) {
      handleSelectProduct(vip_list[0], true)
    } else if (list?.length) {
      handleSelectProduct(list[0], true)
    }
  }, [data, openPayModal, isMixPay])

  const handleRetry = () => {
    openFailModal(false)

    customEventReport('pay_popup', {
      _action: 'retry_click',
      _chap_id: chapter?.chapter_id,
      _chap_order_id: Number(chapter?.serial_number) || 0,
      popup_name: 'pay_failed',
    })
  }

  useEffect(() => {
    if (isOpenFailModal) {
      customEventReport('pay_popup', {
        _action: 'show',
        _chap_id: chapter?.chapter_id,
        _chap_order_id: chapter?.serial_number || 0,
        popup_name: 'pay_failed',
      })
    }
  }, [isOpenFailModal])

  const onFailModalChange = () => {
    customEventReport('pay_popup', {
      _action: 'close',
      _chap_id: chapter?.chapter_id,
      _chap_order_id: Number(chapter?.serial_number) || 0,
      popup_name: 'pay_failed',
    })
    openFailModal(false)
  }

  const balance = useMemo(() => {
    if (!accountInfo) {
      return 0
    }
    return accountInfo.coins + accountInfo.bonus
  }, [accountInfo])

  /** paypal 重定�?*/
  useEffect(() => {
    const redirect = isPayRedirectBack()
    console.log('redirect paypal')

    const { isPayPal, isPayPalCancel, isPayerMax, isPayerMaxClose } = redirect
    const orderInfo = getOrderInfo()
    if (!orderInfo) {
      return
    }

    if (isPayPalCancel) {
      payReport({
        eventName: 'pay_cancel',
      })
      resetUrl()
      return
    }

    if (isPayerMaxClose) {
      payReport({
        eventName: 'pay_cancel',
      })
      resetUrl()
      return
    }
    if (isPayPal || isPayerMax) {
      setGlobalLoading(true)
      checkoutOrder({
        order_id: orderInfo.order_id,
        merchant_order_id: orderInfo.merchant_order_id,
      })
      sessionStorage.setItem('isRedirectPayBack', '1')
      resetUrl()
    }

    return () => {
      setOpenPayModal(false)
    }
  }, [])

  const handlePayModalChange = () => {
    handleRetention({
      pos: 2,
    })
    setOpenPayModal(false)
  }

  return (
    <>
      {/** 商品面板 */}
      <Drawer
        open={openPayModal}
        onClose={handlePayModalChange}
        zIndex={60}
        showCloseButton={false}
      >
        <>
          <div className='sticky top-0 z-10 flex items-center border-b border-white/10 bg-background px-4 py-4 text-[16px] font-bold leading-[normal]'>
            <span className='mr-2'>{t('checkout.balance')}</span>

            <img
              src={siteConfig?.coinIcon || ''}
              alt=''
              width={20}
              height={20}
              className='mr-1 h-5 w-5'
            />

            <span>{balance}</span>
            <div
              className='absolute right-4 top-4 h-6 w-6 bg-[url(https://v-mps.crazymaplestudios.com/images/37d62570-4d7c-11f0-860b-97fc2eb1c6d9.png)] bg-contain bg-no-repeat rtl:left-4 rtl:right-auto'
              onClick={handlePayModalChange}
            ></div>
          </div>
          <div className='h-full touch-pan-y overflow-y-auto overflow-x-hidden px-4'>
            {/* <div className="mt-6 flex items-center font-bold">
              <span className="mr-2">{t("checkout.balance")}</span>
              <img
                src={siteConfig?.coinIcon || ""}
                alt=""
                width={20}
                height={20}
                className="mr-1 h-5 w-5"
              />
              <span>{balance}</span>
            </div> */}
            {/* vip */}
            <VipList
              list={data?.vip_list}
              onClick={handleSelectProduct}
              itemInfo={itemInfo}
            />

            <div className={cn(data?.vip_list?.length ? 'mt-2' : 'mt-4')}>
              <div className='grid grid-cols-2 gap-2'>
                {data?.list?.map((item: any) => {
                  return (
                    <ProductItem
                      key={item.gid}
                      item={item}
                      onClick={handleSelectProduct}
                      itemInfo={itemInfo}
                    />
                  )
                })}
              </div>
            </div>

            <PayMethodV2 />
            <PayButton />

            {/** tip */}
            <div
              className={cn(
                'mt-6 whitespace-pre-line pb-[76px] text-xs text-white/50',
                !isMixPay && 'pb-[16px]'
              )}
            >
              <TextWithLinks
                text={data?.store_tips}
                onClickLink={getFeedbackUrl}
              />
            </div>
          </div>
        </>
      </Drawer>
      {/* 选择支付方式 */}

      {/* 失败弹窗 */}
      <Drawer open={isOpenFailModal} onClose={onFailModalChange} zIndex={70}>
        <div className='p-4 pb-6'>
          <div className='flex items-center justify-center pb-6 pt-2'>
            <FailIcon className='h-[64px] w-[64px]' />
          </div>
          <div className='mb-2 text-center text-base font-bold text-white/90'>
            {t('checkout.fail-tit')}
          </div>
          <div className='text-center text-sm text-white/70'>
            {t('checkout.fail-desc')}
          </div>
          <button
            onClick={handleRetry}
            className='relative isolate mb-2 mt-6 flex h-12 w-full items-center justify-center overflow-hidden rounded text-base font-bold text-white'
            style={siteButtonBgStyle(siteConfig?.buttonBg)}
          >
            <span
              aria-hidden
              className='pointer-events-none absolute inset-0 rounded-[inherit]'
              style={siteButtonOverlayStyle(siteConfig?.buttonOverlay)}
            />
            <span className='relative z-[1]'>{t('checkout.retry')}</span>
          </button>
          <button
            onClick={() => {
              if (siteConfig?.supportEmail) {
                window.location.href = `mailto:${siteConfig.supportEmail}`
              } else {
                getFeedbackUrl()
              }
            }}
            className='flex h-12 w-full items-center justify-center rounded bg-white/10 text-base font-bold text-white'
          >
            {siteConfig?.supportEmail
              ? t('checkout.contact-us', { email: siteConfig.supportEmail })
              : t('checkout.feedback')}
          </button>
        </div>
      </Drawer>
      <PayMethods />
      <Adyen />

      {/** 预请求折扣弹窗背景图 */}
      {siteConfig?.retentionModalBg && (
        <div
          style={{
            background: `url(${siteConfig.retentionModalBg})`,
          }}
        ></div>
      )}
    </>
  )
}
