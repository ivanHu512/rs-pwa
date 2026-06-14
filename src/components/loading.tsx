'use client'
import Spinner from '@/components/ui/spinner'
import { useCheckoutStore } from '@/stores/checkout-store'
export default function GlobalLoading() {
  const isLoading = useCheckoutStore((state) => state.isLoading)
  return (
    <>
      {isLoading && (
        <div className='animate-fade-in animate-duration-200 fixed left-0 top-0 z-[9999] h-screen w-screen bg-black/50'>
          <div className='flex h-full items-center justify-center'>
            <Spinner className='h-12 w-12 fill-white/80 text-transparent' />
          </div>
        </div>
      )}
    </>
  )
}
