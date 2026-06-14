'use client'
import { useShallow } from 'zustand/shallow'

// import PayModal from '@/components/pay-modal'
// import RetentionModal from '@/components/retention-modal'
import { Button } from '@/components/ui/button'
import { useCheckout } from '@/hooks/use-checkout'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'
import { useLoginStore } from '@/stores/login-store'
export default function Demo() {
  const setOpenPayModal = useCheckoutStore((state) => state.setOpenPayModal)
  const userInfo = useDramaStore((state) => state.userInfo)
  const setOpenFailModal = useCheckoutStore((state) => state.setOpenFailModal)
  const { setOpenIapSuccess, setVipSuccessModal } = useCheckoutStore(
    useShallow((state) => ({
      itemInfo: state.itemInfo,
      setOpenIapSuccess: state.setOpenIapSuccess,
      isOpenIapSuccess: state.isOpenIapSuccess,
      setVipSuccessModal: state.setVipSuccessModal,
      setOpenRetentionModal: state.setOpenRetentionModal,
    }))
  )

  const { setOpenLoginModal } = useLoginStore(
    useShallow((state) => ({
      setOpenLoginModal: state.setOpenLoginModal,
    }))
  )

  return (
    <>
      <div className='flex h-screen w-full flex-col items-center justify-center'>
        <div>coins: {userInfo.account?.coins}</div>
        <div>bonus: {userInfo.account?.bonus}</div>
        <div>vip: {userInfo?.account?.vip_status}</div>
        <div className='grid grid-cols-2 gap-2'>
          <Button
            onClick={() => {
              setOpenPayModal(true)
              // setTimeout(() => {
              //   setOpenRetentionModal(true);
              // }, 1000);
            }}
          >
            open pay
          </Button>
          <Button
            onClick={() => {
              setOpenFailModal(true)
            }}
          >
            pay fail
          </Button>
          <Button
            onClick={() => {
              setOpenIapSuccess(true)
            }}
          >
            iap{' '}
          </Button>
          <Button
            onClick={() => {
              setOpenLoginModal(true, 'pay_login_popup')
              setVipSuccessModal({
                open: true,
                type: 1,
              })
            }}
          >
            sub1{' '}
          </Button>
          <Button
            onClick={() => {
              setVipSuccessModal({
                open: true,
                type: 2,
              })
            }}
          >
            sub2{' '}
          </Button>
          <Button
            onClick={() => {
              setOpenLoginModal(true, 'pay_login_popup')
            }}
          >
            Login
          </Button>
          <Button onClick={() => {}}>挽留弹窗回首页</Button>
        </div>
      </div>
      {/* <PayModal /> */}
      {/* <RetentionModal /> */}
    </>
  )
}
