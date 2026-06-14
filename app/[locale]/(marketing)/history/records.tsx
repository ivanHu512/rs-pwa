'use client'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useInViewport } from 'ahooks'
import { images } from '@/assets/images'
import Toast from '@/components/ui/toast'
import { useReport } from '@/hooks/use-report'
import { useTranslations } from 'next-intl'
import { aliOssLoader } from '@/lib/aliOssLoader'
import { getH5History } from '@/lib/services/history'
import { cn } from '@/lib/utils'
import type { HistoryItem } from '@/types/history'
import { useWindowSize } from '@/hooks/use-size'
import { getSiteConfigClient } from '@/lib/config/site'
import { Button } from '@/components/ui/button'
import { useJumpDramaPage } from '@/hooks/use-nav-drama'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useDramaStore } from '@/stores/drama-store'

const siteConfig = getSiteConfigClient()
const HISTORY_PAGE_SIZE = 60
const HISTORY_SHELF_ID = 20001

function getProgressWidth(readProgress?: number) {
  const percent = readProgress || 0
  return `${percent}%`
}

function scrollHistoryToTop() {
  window.scrollTo(0, 0)
  document.documentElement.scrollTop = 0
  document.body.scrollTop = 0
}

const HistoryCard = ({ item }: { item: HistoryItem }) => {
  const { toDramaPage } = useJumpDramaPage()
  const { playEvent } = useReport()
  const t = useTranslations()
  const [hasImageError, setHasImageError] = useState(false)

  return (
    <button
      type='button'
      className='flex w-full flex-col items-start overflow-hidden text-left'
      onClick={() => {
        playEvent({
          subEventName: 'cover_click',
          _page_name: 'library_main',
          _story_id: item.book_id,
          t_book_id: item.t_book_id,
          shelf_id: HISTORY_SHELF_ID,
        })
        toDramaPage(item.book_id, HISTORY_SHELF_ID, item.lang)
      }}
    >
      <div className='relative aspect-[111/148] w-full overflow-hidden rounded-[4px] bg-white/5'>
        {!hasImageError ? (
          <img
            src={aliOssLoader({ src: item.book_pic, width: 360 })}
            alt={item.book_title}
            className='h-full w-full object-cover'
            onError={() => setHasImageError(true)}
          />
        ) : null}
        <div className='absolute inset-x-0 bottom-0 h-px bg-white/15'>
          <div
            className='h-full bg-white'
            style={{ width: getProgressWidth(item.read_progress) }}
          />
        </div>
      </div>
      <div className='mt-[4px] w-full'>
        <h2
          className='w-full overflow-hidden break-words text-[14px] font-[500] leading-normal text-white/90'
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 2,
            textOverflow: 'ellipsis',
            wordBreak: 'break-word',
            overflowWrap: 'anywhere',
          }}
        >
          {item.book_title}
        </h2>
        <div className='mt-[2px] flex w-full gap-[2px] overflow-hidden text-[12px] font-[400] leading-normal'>
          <span className='shrink-0 text-white/90'>
            {t('video.ep', { num: item.read_episode })}
          </span>
          <span className='truncate text-white/50'>
            / {t('video.ep', { num: item.chapter_count })}
          </span>
        </div>
      </div>
    </button>
  )
}

const Records = () => {
  const t = useTranslations()
  const router = useRouter()
  const userInfo = useDramaStore((state) => state.userInfo)
  const { jumpToPage } = useJumpDramaPage()
  const { userHallBookReport, pageClickReport } = useReport()
  const [list, setList] = useState<HistoryItem[]>([])
  const [offset, setOffset] = useState<string | undefined>()
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isApiError, setIsApiError] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement>(null)
  const requestOffsetRef = useRef<string | undefined>('')
  const reportedCountRef = useRef(0)
  const [inViewport] = useInViewport(sentinelRef)
  /** 获取窗口的实际尺寸 */
  const { height: screenH } = useWindowSize()

  // useLayoutEffect(() => {
  //   scrollHistoryToTop()
  //   const frame = window.requestAnimationFrame(scrollHistoryToTop)

  //   return () => window.cancelAnimationFrame(frame)
  // }, [])

  // useEffect(() => {
  //   if (isInitialLoading) return

  //   const frame = window.requestAnimationFrame(scrollHistoryToTop)

  //   return () => window.cancelAnimationFrame(frame)
  // }, [isInitialLoading])

  const loadHistory = useCallback(
    async ({
      nextOffset,
      append,
    }: {
      nextOffset?: string
      append: boolean
    }) => {
      if (append) {
        setIsLoadingMore(true)
      } else {
        setIsInitialLoading(true)
        setIsApiError(false)
      }

      requestOffsetRef.current = nextOffset

      try {
        const response = await getH5History({
          page_size: HISTORY_PAGE_SIZE,
          ...(nextOffset ? { offset: nextOffset } : {}),
        })
        const nextList = response?.list ?? []
        const nextResponseOffset = response?.offset || undefined

        if (requestOffsetRef.current !== nextOffset) {
          return
        }

        if (!append) {
          reportedCountRef.current = 0
        }

        setList((prev) => (append ? [...prev, ...nextList] : nextList))
        setOffset(nextResponseOffset)
        setHasMore(Boolean(nextResponseOffset && nextList.length > 0))
      } catch (error) {
        console.error('Failed to load mini history', error)
        if (!append) {
          setIsApiError(true)
        } else {
          setHasMore(false)
          Toast.show(t('toast.network-timeout'))
        }
      } finally {
        if (requestOffsetRef.current === nextOffset) {
          setIsInitialLoading(false)
          setIsLoadingMore(false)
        }
      }
    },
    [t]
  )

  useEffect(() => {
    if (!userInfo?.uid) return
    loadHistory({ append: false })
  }, [loadHistory, userInfo?.uid])

  useEffect(() => {
    if (!list.length || reportedCountRef.current >= list.length) {
      return
    }

    const nextItems = list.slice(reportedCountRef.current)
    userHallBookReport({
      _page_name: 'library_main',
      item_list: nextItems.map(
        (item, index) =>
          `${reportedCountRef.current + index}#${item.book_id}#${HISTORY_SHELF_ID}#1`
      ),
    })
    reportedCountRef.current = list.length
  }, [list, userHallBookReport])

  useEffect(() => {
    if (!userInfo?.uid) return
    if (!inViewport || isInitialLoading || isLoadingMore || !hasMore) {
      return
    }
    loadHistory({ nextOffset: offset, append: true })
  }, [
    hasMore,
    inViewport,
    isInitialLoading,
    isLoadingMore,
    loadHistory,
    offset,
    userInfo?.uid,
  ])

  const cards = useMemo(
    () =>
      list.map((item) => (
        <HistoryCard
          key={`${item.book_id}-${item.read_chapter_id}-${item.last_view}`}
          item={item}
        />
      )),
    [list]
  )

  /** 部分接口报错 */
  if (isApiError) {
    return (
      <div
        className='fixed left-0 top-0 z-[999] z-[9] h-full w-full'
        style={{ height: screenH }}
      >
        <div className='mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center bg-[#000] px-[48px]'>
          <i
            className='block h-[160px] w-[160px] bg-contain bg-no-repeat'
            style={{ backgroundImage: `url(${siteConfig?.tryAgainIcon})` }}
          ></i>
          <div className='mb-[40px] mt-[6px] text-center text-[14px] font-[400] text-white/50'>
            {t('video.network-error')}
          </div>
          <Button
            className='flex h-[40px] items-center justify-center gap-1 rounded-[4px] px-[40px] text-[16px] font-[700] text-white/90'
            onClick={() => {
              if (!navigator.onLine) {
                Toast.show(t('toast.network-timeout'))
                return
              }
              loadHistory({ append: false })
            }}
          >
            {t('video.try-again')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className='fixed top-0 z-[9] mx-auto w-full max-w-xl'>
        <h1 className='flex w-full items-center justify-center bg-black py-[12px] text-[16px] font-[700] leading-normal text-white/90'>
          <i
            className='absolute left-[16px] inline-block h-[24px] w-[24px] bg-contain bg-no-repeat'
            style={{ backgroundImage: `url(${images.iconBack})` }}
            onClick={() => router.back()}
          ></i>
          {t('history.title')}
        </h1>
      </div>
      <section
        className='relative bg-black px-[16px] pt-[50px]'
        style={{ height: screenH }}
      >
        {list.length > 0 ? (
          <>
            <div className='grid grid-cols-3 gap-x-[5px] gap-y-[16px]'>
              {cards}
            </div>
            <div ref={sentinelRef} className='h-[4px]' />
            {isLoadingMore ? (
              <div className='flex justify-center py-[16px]'>
                <Image
                  src={images.hallBookLoadingIcon}
                  alt='loading'
                  width={24}
                  height={24}
                  onError={(event) => {
                    event.currentTarget.onerror = null
                    event.currentTarget.src = images.iconLoading
                  }}
                />
              </div>
            ) : null}
          </>
        ) : null}

        {!isInitialLoading && list.length === 0 ? (
          <div className='absolute left-1/2 top-[130px] flex w-[279px] -translate-x-1/2 flex-col items-center gap-[8px]'>
            <Image src={images.emptyIcon} alt='' width={160} height={160} />
            <p className='w-full overflow-hidden text-center text-[14px] font-[400] leading-normal text-white/50'>
              {t('history.emptyText')}
            </p>
            <Button
              className='mt-[20px] flex h-[40px] w-[160px] items-center justify-center rounded-[4px] px-[24px] text-center text-[14px] font-[700] leading-[1.3] text-white/90'
              onClick={() => {
                jumpToPage()
                pageClickReport({
                  _page_name: 'library_main',
                  _element_name: 'watch_now',
                })
              }}
            >
              {t('history.watchNow')}
            </Button>
          </div>
        ) : null}

        {isInitialLoading ? (
          <div
            className={cn(
              'fixed inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px))] top-0',
              'z-40 flex items-center justify-center bg-transparent'
            )}
          >
            <div className='rounded-[8px] bg-[#3D3D3D] p-[32px]'>
              <img
                src={images.iconLoading}
                className='h-[40px] w-[40px]'
                alt='#'
              />
            </div>
          </div>
        ) : null}
      </section>
    </>
  )
}

export default Records
