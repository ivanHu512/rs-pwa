import { useLocation, useNavigate } from "react-router-dom";
import { useI18n } from '@/i18n'
import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { useShallow } from 'zustand/shallow'

import { Button } from '@/components/ui/button'
import { useOneLink } from '@/hooks/use-nav-chapter'
import { cn, getConfigId, getH5Advertise, getH5mode } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'
import { storyStatus } from '@/types/drama'
const UnpublishModal: React.FC = () => {
  const { locale, t } = useI18n()
  const navigate = useNavigate();
  const { bookStatus } = useDramaStore(
    useShallow((state) => ({
      bookStatus: state.bookStatus,
    }))
  )

  const { jumpOneLink } = useOneLink()

  useLayoutEffect(() => {
    if (bookStatus === storyStatus.BOOK_UNPUBLISH) {
      const model = getH5mode()
      const configId = getConfigId()
      const { pixel, mediaType } = getH5Advertise()
      const params = new URLSearchParams()
      if (model) params.set('h5mode', model)
      if (configId) params.set('configId', configId)
      if (pixel) params.set('pixel', pixel)
      if (mediaType) params.set('mediaType', mediaType)

      const paramsString = params.toString()
      navigate(`/${locale}${paramsString ? `/?${paramsString}` : ''}`)
      window.routerTime = Date.now()
    }
  }, [bookStatus])

  const isAllowedDomain = () => {
    const hostname = window.location.hostname

    // 允许的域名列�?
    const allowedDomains = [
      'test-delivery-drama-web.epubgame.com',
      'gray-drama.reelshort.com',
      'drama.reelshort.com',
      'localhost',
    ]

    return allowedDomains.includes(hostname)
  }

  const showButton = isAllowedDomain()

  return (
    <div
      className={cn(
        'fixed inset-0 z-[100] flex h-[100dvh] h-[100vh] w-full items-center justify-center bg-black/65'
      )}
    >
      <div
        className={cn(
          'z-[100] flex w-full flex-col items-center justify-center px-[48px]'
        )}
      >
        <div className='flex flex-col items-center justify-center'>
          <i className="block h-[160px] w-[160px] bg-[url('https://v-mps.crazymaplestudios.com/images/ec2b3550-e0c1-11f0-84ad-6b5693b490dc.png')] bg-contain bg-no-repeat"></i>
          <div className='mb-[40px]'>
            <label className='text-center text-[14px] text-white/50'>
              {t('video.book-expire')}
            </label>
          </div>
          {showButton && (
            <div className='w-full px-[50px]'>
              <Button
                className='flex h-[40px] w-full items-center justify-center gap-1 rounded-[4px] px-[40px] text-[16px] font-[700] text-white/90'
                onClick={jumpOneLink}
              >
                {t('video.get-app')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(UnpublishModal)
