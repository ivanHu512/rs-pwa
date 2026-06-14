import { useRouter } from 'next/navigation'
import { useCheckout } from '@/hooks/use-checkout'
import { cn, getConfigId, getH5mode, getH5Advertise } from '@/lib/utils'
import { useLocale } from 'next-intl'
import { HomeIcon, HomeIcon2 } from './ui/icons'
import { useEffect, useState } from 'react'
import { isReelshort } from '@/lib/config/site'

export default function BackHome({ className }: { className?: string }) {
  const router = useRouter()
  const locale = useLocale()
  const { handleRetention } = useCheckout()
  const [isReelShort, setIsReelShort] = useState(false)

  useEffect(() => {
    setIsReelShort(isReelshort())
  }, [])

  const handleBackHome = () => {
    const model = getH5mode()
    const configId = getConfigId()

    handleRetention({
      next: () => {
        const { pixel, mediaType } = getH5Advertise()
        const params = new URLSearchParams()
        if (model) params.set('h5mode', model)
        if (configId) params.set('configId', configId)
        if (pixel) params.set('pixel', pixel)
        if (mediaType) params.set('mediaType', mediaType)

        const paramsString = params.toString()
        router.push(`/${locale}${paramsString ? `/?${paramsString}` : ''}`)
        window.routerTime = Date.now()
      },
      pos: 1,
    })
  }

  return (
    <div
      onClick={handleBackHome}
      onTouchEnd={(e) => {
        e.stopPropagation()
        handleBackHome()
      }}
      className={cn(
        'absolute left-[16px] top-[64px] flex h-[40px] w-[40px] items-center justify-center rounded-[8px] bg-black/50',
        className
      )}
    >
      {isReelShort ? <HomeIcon /> : <HomeIcon2 />}
    </div>
  )
}
