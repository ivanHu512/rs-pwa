'use client'

import { useRafInterval, useThrottleFn } from 'ahooks'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import type { CSSProperties } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { images } from '@/assets/images'
import { useJumpDramaPage } from '@/hooks/use-nav-drama'
import { useReport } from '@/hooks/use-report'
import { aliOssLoader } from '@/lib/aliOssLoader'
import {
  getSiteConfigClient,
  siteButtonBgStyle,
  siteButtonOverlayStyle,
} from '@/lib/config/site'
import { pxToVw } from '@/lib/rem'
import { cn } from '@/lib/utils'
import { BannerItemType } from '@/types/hall'

const BANNER_CONFIG = {
  /** 最多展示数 */
  limitShowNum: 8,
  switchInterval: 5000,
  mbImg: {
    width: 375,
    height: 460,
  },
}

interface IProps {
  bannerList: BannerItemType[]
}

export default function Banner(props: IProps) {
  const { toDramaPage } = useJumpDramaPage()
  const { userHallBannerReport, playEvent } = useReport()

  const touchPointRef = useRef<{
    startX: number
    startY: number
  }>(undefined)

  const [current, setCurrent] = useState(0)

  const [autoInterval, setAutoInterval] = useState<number | undefined>(
    BANNER_CONFIG.switchInterval
  )
  const { bannerList } = props

  const [buttonPlayStyle, setButtonPlayStyle] = useState<CSSProperties>({})
  const [buttonPlayOverlayStyle, setButtonPlayOverlayStyle] =
    useState<CSSProperties>({})

  const activeBanner = bannerList[current]
  const t = useTranslations()
  /** 自动轮播 */
  const stopInterval = useRafInterval(() => {
    const len = bannerList.length
    setCurrent((current) => (current + 1) % len)
  }, autoInterval)

  useEffect(() => {
    if (autoInterval === undefined) {
      const timer = setTimeout(() => {
        setAutoInterval(BANNER_CONFIG.switchInterval)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [autoInterval])

  useEffect(() => {
    const siteConfig = getSiteConfigClient()
    setButtonPlayStyle(siteButtonBgStyle(siteConfig?.buttonBg))
    setButtonPlayOverlayStyle(siteButtonOverlayStyle(siteConfig?.buttonOverlay))
  }, [])

  const resetInterval = () => {
    setAutoInterval(undefined)
  }

  const { run: reportSDKFunThrottle } = useThrottleFn(
    () => {
      userHallBannerReport({
        _action: 'show',
        iad_id: activeBanner?.b_id,
        iad_lang: 'en',
        iad_info: activeBanner,
        shelf_id: 90001,
      })
    },
    { wait: 1000 }
  )

  /** 切换banner  */
  useEffect(() => {
    reportSDKFunThrottle()
  }, [current, reportSDKFunThrottle])

  // hover切换节流
  const { run: switchBanner } = useThrottleFn(
    (index: number) => {
      const imgIdx =
        index < 0 ? bannerList.length - 1 : index % bannerList.length

      setCurrent(imgIdx)
      resetInterval()
    },
    { leading: false, wait: 100 }
  )

  const switchPrev = () => {
    switchBanner(current - 1)
  }

  const switchNext = () => {
    switchBanner(current + 1)
  }

  const onJumpVideos = () => {
    const book_id = activeBanner?.jump_param?.book_id || activeBanner?.book_id
    console.log(
      '%c [ activeBanner ]-73',
      'font-size:13px; background:#8bd2e6; color:#cfffff;',
      activeBanner
    )
    //跳转上报
    userHallBannerReport({
      _action: 'click',
      iad_id: activeBanner?.b_id,
      iad_lang: 'en',
      iad_info: activeBanner,
      shelf_id: 90001,
    })
    book_id && toDramaPage(book_id, 90001)
  }

  // 添加固定参数到图片URL的工具函数
  const addImageParams = (imageUrl: string) => {
    if (!imageUrl) return imageUrl

    const url = new URL(imageUrl)
    // 添加固定参数，例如：v=1.0&format=webp
    url.searchParams.set('v', '1.0')

    return url.toString()
  }

  const placeholderImage = useMemo(() => {
    return (
      <div
        className={cn(
          'z-1 invisible w-full max-w-xl opacity-0 will-change-transform'
        )}
        style={{
          height: `${pxToVw(BANNER_CONFIG.mbImg.height)}`,
          width: `${pxToVw(BANNER_CONFIG.mbImg.width)}`,
        }}
      ></div>
    )
  }, [bannerList])

  const bannerPagination = useMemo(() => {
    return (
      <div
        className={cn(
          'z-1 absolute bottom-0 flex w-full max-w-xl justify-center gap-[6px]'
        )}
      >
        {bannerList.map((item: any, index: number) => {
          const active = current === index

          return (
            <div
              key={item.b_id}
              className={cn(
                'relative',
                active
                  ? 'h-[4px] w-[32px] rounded-[5px] bg-white'
                  : 'h-[4px] w-[12px] cursor-pointer rounded-full bg-white/50'
              )}
              onClick={(e) => {
                e.stopPropagation()
                switchBanner(index)
              }}
            ></div>
          )
        })}
      </div>
    )
  }, [bannerList, current])

  if (!bannerList.length) {
    return <div style={{ height: '66px' }}></div>
  }

  return (
    <>
      <div className='relative top-0 h-full max-h-[700px] w-full max-w-xl overflow-hidden'>
        <div className='z-1 absolute top-0 flex max-h-[700px] w-full max-w-xl justify-center bg-[#12081b]'>
          {bannerList.map((item: BannerItemType, index: number) => {
            const active = current === index
            return (
              <div
                key={index}
                className='duration-[600ms] ease absolute top-0 h-full max-h-[700px] w-full max-w-xl cursor-pointer bg-black transition-all'
                style={{
                  opacity: active ? 1 : 0,
                }}
                onClick={onJumpVideos}
              >
                <div
                  className={`absolute left-1/2 h-full max-h-[700px] w-full max-w-xl translate-x-[-50%]`}
                >
                  <Image
                    src={addImageParams(item.pic)}
                    alt='banner'
                    priority={index === 0}
                    fill
                    className='object-cover object-[67%]'
                    loader={(params) =>
                      aliOssLoader({
                        ...params,
                        width: 1920,
                        disableWebP: index === 0,
                      })
                    }
                  />
                  {/* <div
                    className="pointer-events-none absolute left-0 top-0 h-full w-[19%] md:pt-[66px]"
                    style={{
                      background:
                        'linear-gradient(90deg, #000000 0%, rgba(0, 0, 0, 0) 100%)',
                    }}
                  ></div>
                  <div
                    className="pointer-events-none absolute right-0 top-0 h-full w-[19%] md:pt-[66px]"
                    style={{
                      background:
                        'linear-gradient(270deg, #000000 0%, rgba(0, 0, 0, 0) 100%)',
                    }}
                  ></div> */}
                </div>
              </div>
            )
          })}

          {placeholderImage}
        </div>

        <div
          className='z-1 relative top-0 flex max-h-[700px] w-full max-w-xl flex-col'
          onTouchStart={(e) => {
            e.stopPropagation()
            const touch = e.touches[0]
            touchPointRef.current = {
              startX: touch.clientX,
              startY: touch.clientY,
            }
          }}
          onTouchMove={(e) => {
            e.stopPropagation()
            if (!touchPointRef.current) return
            const touch = e.touches[0]
            const deltaX = touch.clientX - touchPointRef.current.startX
            const deltaY = touch.clientY - touchPointRef.current.startY

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
              if (deltaX > 50) {
                switchPrev()
                touchPointRef.current = undefined
              } else if (deltaX < -50) {
                switchNext()
                touchPointRef.current = undefined
              }
            }
          }}
        >
          <div
            className='absolute left-1/2 z-10 h-full max-h-[700px] w-full max-w-xl translate-x-[-50%] cursor-pointer'
            onClick={onJumpVideos}
          >
            {/* banner分页 */}
            {bannerPagination}

            {/* banner 信息 */}
            <div
              className={cn(
                'absolute bottom-[16px] left-0 flex w-full max-w-xl flex-col items-center justify-center'
              )}
            >
              {/* 剧集title */}
              <div
                className={cn(
                  'line-height-120% mb-[16px] w-[343px] break-words text-center text-[24px] font-bold text-white/90'
                )}
              >
                {activeBanner?.jump_param?.book_title ||
                  activeBanner?.book_title}
              </div>

              {/* play 按钮 */}
              <div
                className={cn(
                  'relative isolate flex h-[40px] w-[168px] cursor-pointer items-center justify-center overflow-hidden rounded-[4px] py-[11px] text-[16px] font-bold text-white'
                )}
                style={buttonPlayStyle}
                onClick={(e) => {
                  e.stopPropagation()
                  onJumpVideos()
                }}
              >
                <span
                  aria-hidden
                  className='pointer-events-none absolute inset-0 rounded-[inherit]'
                  style={buttonPlayOverlayStyle}
                />
                <span className='relative z-[1] inline-flex items-center'>
                  <Image
                    src={images.playIconWhite}
                    className='mr-[4px] text-[16px]'
                    alt='play'
                    loading='lazy'
                    width={18}
                    height={18}
                    unoptimized
                  />
                  {t('hall.play')}
                </span>
              </div>
            </div>
          </div>

          {placeholderImage}

          {/* 上下阴影 */}
          {/* <div className="pointer-events-none absolute top-0 h-2/5 w-full from-black to-[rgba(0,0,0,0)] bg-gradient-to-b md:max-h-170px"></div> */}
          <div className='z-1 pointer-events-none absolute -bottom-1 h-2/5 max-h-72 w-full max-w-xl bg-gradient-to-t from-black to-[rgba(0,0,0,0)]'></div>
        </div>
      </div>
    </>
  )
}
