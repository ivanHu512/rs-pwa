'use client'
import '@adyen/adyen-web/styles/adyen.css'
import '@/styles/adyen.css'

import { Card, Dropin } from '@adyen/adyen-web'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useShallow } from 'zustand/shallow'

import { Modal } from '@/components/dialog'
import { UIArrowsDown } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'

const cardsStyles = {
  styles: {
    base: {
      color: '#fff',
      background: '#141414',
    },
    error: {
      color: '#fff',
    },
  },
}
export default function Adyen() {
  const { adyenCheckout, isOpenAdyenModal, setOpenAdyenModal } =
    useCheckoutStore(
      useShallow((state) => ({
        adyenCheckout: state.adyenCheckout,
        isOpenAdyenModal: state.isOpenAdyenModal,
        setOpenAdyenModal: state.setOpenAdyenModal,
      }))
    )

  const cardRef = useRef(null)
  const container = useRef<any>(null)

  useEffect(() => {
    container.current = document.body
  }, [])
  useEffect(() => {
    if (!adyenCheckout) {
      return
    }

    console.log('init card')

    if (cardRef.current) {
      new Dropin(adyenCheckout, {
        disableFinalAnimation: true,
        paymentMethodComponents: [Card],
        openPaymentMethod: {
          type: 'scheme',
        },
        paymentMethodsConfiguration: {
          storedCard: {
            ...cardsStyles,
          },
          card: {
            hasHolderName: true,
            holderNameRequired: true,
            enableStoreDetails: true,
            ...cardsStyles,
          },
        },
      }).mount(cardRef.current)
    }
    // 延迟 100ms 等待 DOM 渲染
  }, [adyenCheckout])

  const handleBack = () => {
    setOpenAdyenModal(false)
  }

  useEffect(() => {
    return () => {
      setOpenAdyenModal(false)
    }
  }, [])

  if (!container.current) {
    return null
  }

  return (
    <>
      <Modal isOpen={isOpenAdyenModal} onOpenChange={setOpenAdyenModal}>
        {/* 这里必须用Modal组件当成占位， 自己写的弹窗会和之前的打开弹窗有冲突，很坑。。 */}
        <div></div>
      </Modal>
      {createPortal(
        <div
          className={cn(
            'pan-y pointer-events-auto invisible fixed left-0 top-0 z-[-10] h-full w-full bg-black opacity-0',
            isOpenAdyenModal ? 'visible z-[200] opacity-100' : ''
          )}
        >
          <div className='mx-auto w-full max-w-xl px-4'>
            <div className='mb-4 flex h-[48px] items-center'>
              <div onClick={handleBack} className='rotate-90'>
                <UIArrowsDown className='w-[32px]' />
              </div>
            </div>
            <div ref={cardRef}></div>
          </div>
        </div>,
        container.current
      )}
    </>
  )
}
