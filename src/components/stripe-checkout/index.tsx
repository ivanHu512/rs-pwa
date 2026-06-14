'use client'
import {
  PaymentElement,
  useElements,
  useStripe,
  // ExpressCheckoutElement,
} from '@stripe/react-stripe-js'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import React, { useState } from 'react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useReport } from '@/hooks/use-report'
import { getOrderInfo } from '@/lib/checkout'

import Spinner from '../ui/spinner'

const StripeCheckoutForm: React.FC = (): any => {
  const t = useTranslations()
  const [isReady, setIsReady] = useState(false)
  const [submit, setSubmit] = useState(false)
  const stripe = useStripe()
  const elements = useElements()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect')

  const { payReport } = useReport()

  const handleSubmit = async (event: any) => {
    event.preventDefault()
    const orderInfo = getOrderInfo()
    if (!stripe || !elements) {
      return
    }
    setSubmit(true)
    payReport(
      {
        eventName: 'pay_start',
        // orderInfo,
      },
      true
    )

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: redirect || window.location.href,
      },
    })
    setSubmit(false)
    if (error && error.type !== 'validation_error') {
      toast(error.message || '')

      payReport({
        eventName: 'pay_failed',
        // orderInfo,
      })
    }
  }

  return (
    <form>
      {/* <div className="mb-2">
        <ExpressCheckoutElement
          onConfirm={handleSubmit}
          options={{
            layout: {
              maxColumns: 1,
              maxRows: 2,
              overflow: "auto",
            },
            paymentMethodOrder: ["apple_pay", "google_pay"],
            
          }}
        />
      </div> */}
      <PaymentElement
        onReady={() => {
          setIsReady(true)
        }}
      />
      {isReady && (
        <div className='fixed bottom-0 left-0 w-full bg-background p-4'>
          <div className='mx-auto md:max-w-xl'>
            <Button
              disabled={submit}
              variant='default'
              className='h-12 w-full font-bold text-white'
              onClick={handleSubmit}
            >
              {submit ? (
                <Spinner className='h-12 w-12 fill-white/80 text-transparent' />
              ) : (
                t('pay')
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  )
}
export default StripeCheckoutForm
