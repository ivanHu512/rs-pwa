import { useCheckoutStore } from '@/stores/checkout-store'
import { useShallow } from 'zustand/shallow'
import { useCheckout } from '@/hooks/use-checkout'
import { METHODS_INFO } from '@/lib/checkout'
import { useReport } from '@/hooks/use-report'

export default function PayButton() {
  const { selectedMethod, itemInfo } = useCheckoutStore(
    useShallow((state) => ({
      itemInfo: state.itemInfo,
      selectedMethod: state.selectedMethod,
    }))
  )
  const { payHandler, isMixPay } = useCheckout()
  const { payReport } = useReport()

  if (!selectedMethod || !itemInfo || !isMixPay) return null

  const { type } = selectedMethod

  const amount = itemInfo.promotion_price || itemInfo.price

  const {
    bg,
    text,
    payIcon,
    icon,
    channel,
    subChannel = '',
  } = METHODS_INFO[type] || {}
  const displayIcon = payIcon || icon

  const backgroundColor = bg || '#FFFFFF'
  const textColor = text || '#000000'

  const handlePay = () => {
    payReport({
      eventName: 'pay_btn_click',
      other: {
        pay_channel_sub_class: subChannel,
        pay_channel: channel,
      },
    })
    payHandler(type)
  }

  return (
    <div className='fixed bottom-0 left-0 right-0 z-[1000] transform-gpu bg-[#141414] p-4'>
      <div
        className='mx-auto flex h-[40px] w-full items-center justify-center rounded text-[14px] font-bold'
        onClick={handlePay}
        style={{
          background: backgroundColor,
          color: textColor,
        }}
      >
        {displayIcon && (
          <img
            src={displayIcon}
            alt=''
            className='mr-1 h-4 w-auto'
            height={32}
            width={0}
            style={{ width: 'auto' }}
          />
        )}
        ${amount}
      </div>
    </div>
  )
}
