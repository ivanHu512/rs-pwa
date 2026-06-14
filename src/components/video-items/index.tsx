import { useParams, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/i18n'
import React, {
  CSSProperties,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useShallow } from 'zustand/shallow'

import { Button } from '@/components/ui/button'
import VerticalSwiper from '@/components/ui/vertical-swiper'
import Page from '@/components/video-items/page'
import { getSiteConfigClient } from '@/lib/config/site'
import { useDramaData } from '@/hooks/use-drama-data'
import { useNavChapter } from '@/hooks/use-nav-chapter'
import { useReport } from '@/hooks/use-report'
import { useWindowSize } from '@/hooks/use-size'
/** 阿里播放器组�?*/
import AliVideo from '@/components/ui/video/IndexAli'
import { useVideoPool } from '@/hooks/use-video-ali-pool'
/** 原生播放器组件，方便回滚 */
import NativeVideo from '@/components/ui/video/Index'
import { useVideoNativePool } from '@/hooks/use-video-pool'
import { localKeyHand } from '@/lib/constant'
import { aliOssLoader } from '@/lib/aliOssLoader'
import { useDramaStore } from '@/stores/drama-store'
import { useSwiperStore } from '@/stores/swiper-store'
import {
  ChapterLockStatus,
  DramaProps,
  ExposeRef,
  MoveVideoProps,
  PageRef,
  storyStatus,
  VideoRef,
} from '@/types/drama'
import { usePlayerVariant } from '@/components/provide'
import Header from '@/components/header'
import PayModal from '@/components/pay-modal'
import AppModal from '@/components/app-modal'
import DramaPopup from '@/components/drama-popup'
import UnlockedToast from '@/components/video-items/unlocked-toast'
import UnpublishModal from '@/components/unpublish-modal'
import { getRangeAroundIndex, URLManager } from '@/lib/utils'
import RetentionModal from '../retention-modal'

const urlManager = new URLManager()
const siteConfig = getSiteConfigClient()
/**延迟2s, 提示滑动按钮消失 */
const delay = 4000
/**手势动画是否展示过，存储local�?*/
const hand = '1'
/**swiper动画时间 */
const animateDelay = 100

const VideoItems: React.FC<DramaProps> = (props) => {
  const playerVariant = usePlayerVariant()
  const isAliPlayer = playerVariant === 'ali'
  const initSort = props.sort || 0
  const { t } = useI18n()
  const { id: bookId } = useParams() as { id: string }
  const homeRef = useRef<HTMLDivElement>(null)
  const swiperRef = useRef<ExposeRef>(null)
  const compRef = useRef<VideoRef>(null)
  const loadContentRef = useRef<boolean>(false)
  const { navigateToChapter } = useNavChapter()
  const { playEvent, appDownloadReport } = useReport()
  const {
    bookStatus,
    isApiError,
    enableSwipe,
    chapterList,
    // isDataLoading,
    updateControlStatus,
    updateCurrentChapter,
    updateAppModalVisible,
    updateDrawerVisible,
    setShowControls,
    updateTouchClick,
    setOpacity,
    opacity,
    currentChapterId,
    currentIsLock,
    currentDuration,
    currentChapterSort,
  } = useDramaStore(
    useShallow((state) => ({
      bookStatus: state.bookStatus,
      isApiError: state.isApiError,
      enableSwipe: state.enableSwipe,
      chapterList: state.chapterList,
      // isDataLoading: state.isDataLoading,
      updateControlStatus: state.updateControlStatus,
      updateCurrentChapter: state.updateCurrentChapter,
      updateAppModalVisible: state.updateAppModalVisible,
      updateDrawerVisible: state.updateDrawerVisible,
      setShowControls: state.setShowControls,
      updateTouchClick: state.updateTouchClick,
      setOpacity: state.setOpacity,
      opacity: state.opacity,
      // setEnableSwipe: state.setEnableSwipe,
      currentChapterId: state.currentChapter.chapter_id,
      currentIsLock: state.currentChapter.is_lock,
      currentDuration: state.currentChapter.duration,
      currentChapterSort: state.currentChapter.sort,
    }))
  )
  const chapterListRef = useRef(chapterList)

  useEffect(() => {
    chapterListRef.current = chapterList
  }, [chapterList])

  /** video挂载对象 */
  const containerRefs = useRef<Record<number, HTMLDivElement>>({})

  /** 设置初始化章节下标，用于更新videoPool */
  const currentIndexRef = useRef<number>(
    (() => {
      if (typeof window === 'undefined') return initSort
      const url = new URL(window.location.href)
      const sort = url.searchParams.get('sort')
      return sort ? Number(sort) : initSort
    })()
  )
  const [guideHandStatus, setGuideHandStatus] = useState(false)
  /** swiper全局管理 */
  const setSwiperRef = useSwiperStore((state) => state.setSwiperRef)
  /** 获取窗口的实际尺�?*/
  const { height: screenH } = useWindowSize()

  /**
   * �?ref 存储到全局 store
   */
  useEffect(() => {
    setSwiperRef(swiperRef as React.RefObject<ExposeRef>)
    return () => {
      setSwiperRef(null)
    }
  }, [setSwiperRef])

  /**
   * 先在服务端设置初始化数据
   */
  const totalChapterList = useMemo(() => {
    const preload = props.preload
    if (!chapterListRef.current.length && preload?.length) {
      return preload
    }
    return chapterListRef.current
  }, [chapterListRef.current, props.preload])

  /** 控制video移动到对应页�?*/
  /** 阿里播放器组�?*/
  const aliVideoPool = useVideoPool()
  /** 原生播放器组件，方便回滚 */
  const nativeVideoPool = useVideoNativePool()
  const videoCompRef = isAliPlayer
    ? aliVideoPool.videoCompRef
    : nativeVideoPool.videoCompRef
  const switchToVideo = useCallback(
    (data: MoveVideoProps) => {
      return isAliPlayer
        ? aliVideoPool.switchToVideo(data)
        : nativeVideoPool.switchToVideo(data)
    },
    [isAliPlayer, aliVideoPool.switchToVideo, nativeVideoPool.switchToVideo]
  )

  /** 初始化数据逻辑 */
  const { handleChapterContent } = useDramaData({
    ...props,
    switchToVideo,
    containerRefs,
  })

  /** 防抖定时器引用，用于快速滑动时的防抖处�?*/
  const slideChangeTimerRef = useRef<number | null>(null)

  /** 上一次切换的章节ID，用于避免重复切�?*/
  const lastChapterIdRef = useRef<string | null>(null)

  /**
   * 切换章节触发
   * @param index 章节下标
   */
  const handleSlideChange = useCallback(
    async (index: number, autoLock?: boolean) => {
      // 清除之前的防抖定时器
      if (slideChangeTimerRef.current) {
        clearTimeout(slideChangeTimerRef.current)
        slideChangeTimerRef.current = null
      }

      const chapter = chapterListRef.current[index]
      if (!chapter) return

      // 如果切换到同一个章节，直接返回
      if (lastChapterIdRef.current === chapter.chapter_id) {
        return
      }

      setShowControls(false)
      setOpacity(false)
      loadContentRef.current = false

      urlManager.setParams(
        {
          sort: String(index),
          cpId: chapter.chapter_id,
        },
        true
      )

      /**切换视频和播放结束事件上�?*/
      const switchVideoAndReportEnd = () => {
        const preChapterId = currentChapterId || ''
        const historyPlayProgress =
          compRef.current?.progressMapRef?.[bookId]?.[preChapterId]
        playEvent({
          subEventName: 'play_end',
          type: 'other',
          is_free: currentIsLock === ChapterLockStatus.FREE ? 1 : 0,
          process:
            (Number(historyPlayProgress?.currentTime) /
              Number(currentDuration)) *
            100,
        })
        const isSupportConnection = 'connection' in navigator
        const customNavigator: NavigatorWithConnection = navigator
        const currentTime = Date.now()
        window.charge = {
          page_trace_id: uuidv4(),
          time: currentTime,
        }
        window.isNotInit = true
        playEvent({
          subEventName: 'play_enter',
          is_unlock: chapter.is_lock === ChapterLockStatus.LOCKED ? 1 : 2,
          // is_first_play_chap: chapter.sort ? 2 : 1,
          is_first_play_chap: 2,
          _chap_id: chapter.chapter_id || '',
          video_id: chapter.video_id || '',
          chap_total_duration: chapter.duration || 0,
          _chap_order_id: chapter?.serial_number || 0,
          video_type: chapter.video_type || 1,
          video_clarity: chapter.dpi || 540,
          is_free: chapter.is_lock === ChapterLockStatus.FREE ? 1 : 0,
          action_ts: currentTime,
          ctime: Math.floor(new Date().getTime() / 1000),
          page_trace_id: window.charge?.page_trace_id,
          ...(isSupportConnection && {
            _rtt: customNavigator?.connection?.rtt,
            _effectiveType: customNavigator?.connection?.effectiveType,
          }),
        })
        if (!autoLock) {
          updateCurrentChapter(chapter)
        } else {
          if (!loadContentRef.current) {
            updateCurrentChapter(chapter)
          }
        }
        currentIndexRef.current = index
        lastChapterIdRef.current = chapter.chapter_id
        switchToVideo?.({
          newContainer: containerRefs.current[chapter?.serial_number || 0],
          chapterId: chapter.chapter_id,
          url: chapter.url || '',
        })
      }

      // 根据 autoLock 决定是否延迟执行
      if (autoLock) {
        slideChangeTimerRef.current = setTimeout(
          switchVideoAndReportEnd,
          animateDelay
        )
      } else {
        switchVideoAndReportEnd()
      }

      /**记录相应时机*/
      const isSuccess = await handleChapterContent({
        chapterId: chapter.chapter_id,
        autoLock,
      })
      loadContentRef.current = Boolean(isSuccess)
    },
    [
      currentChapterId,
      currentDuration,
      currentIsLock,
      switchToVideo,
      containerRefs,
      updateCurrentChapter,
      setShowControls,
      setOpacity,
      handleChapterContent,
      playEvent,
      bookId,
    ]
  )

  /**
   * 组件卸载时清理定时器
   */
  useEffect(() => {
    return () => {
      if (slideChangeTimerRef.current) {
        clearTimeout(slideChangeTimerRef.current)
        slideChangeTimerRef.current = null
      }
    }
  }, [])

  /**
   * 当前视频播放结束, 自动切换下一�?
   */
  const handleEnded = useCallback(
    (id: string) => {
      /** 播放结束，遇到卡点章节，唤起app引导弹窗 */
      if (
        id ===
        chapterListRef.current[chapterListRef.current.length - 1]?.chapter_id
      ) {
        // updateAppModalVisible(true);
        updateDrawerVisible(false)
        appDownloadReport({ _action: 'show' })
      } else {
        const chapter = chapterListRef.current[currentIndexRef.current + 1]
        if(chapter) {
          navigateToChapter(chapter, true)
        }
      }
    },
    [
      // updateAppModalVisible,
      updateDrawerVisible,
      appDownloadReport,
      navigateToChapter,
    ]
  )

  /**
   * 等待用户第一张视频资源加载成功，再展示手势引�?
   * @param status true：表示直接消�?
   */
  const handleReady = useCallback((status?: boolean) => {
    const isHandShow = localStorage.getItem(localKeyHand)
    if (!isHandShow) {
      setGuideHandStatus(Boolean(status))
      localStorage.setItem(localKeyHand, hand)
      setTimeout(() => {
        setGuideHandStatus(false)
      }, delay)
    } else {
      setGuideHandStatus(false)
    }
  }, [])

  /**
   * 样式计算 - 优化依赖�?
   */
  const getStyles = useCallback(
    (cover: string, shouldRender?: boolean, chapterId?: string) => {
      if (!shouldRender) return {}
      if (chapterId === currentChapterId && opacity) return {}
      const croppedCover = aliOssLoader({ src: cover, width: 640 })
      return {
        style: {
          backgroundImage: `url(${croppedCover})`,
          backgroundSize: 'contain',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center center',
        } as CSSProperties,
      }
    },
    [opacity, currentChapterId]
  )
  const setPageRef = useCallback((key: number) => {
    return (el: HTMLDivElement | null) => {
      if (el) {
        containerRefs.current[key] = el
      } else {
        delete containerRefs.current[key]
      }
    }
  }, [])

  /** 作品已下�?*/
  if (bookStatus === storyStatus.BOOK_UNPUBLISH) {
    return <UnpublishModal />
  }

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
            onClick={() => location.reload()}
          >
            {t('video.try-again')}
          </Button>
        </div>
      </div>
    )
  }
  // console.log('currentChapterSort', totalChapterList)
  return (
    <div ref={homeRef} className='relative h-[100vh] w-full'>
      <Header />
      <VerticalSwiper
        ref={swiperRef}
        initialSlide={initSort}
        enableSwipe={enableSwipe}
        screenH={screenH}
        onSlideChange={handleSlideChange}
        onTouchStart={() => {
          updateTouchClick(false)
          setGuideHandStatus(false)
        }}
        onJudgeClick={(flag) => {
          updateTouchClick(flag)
        }}
      >
        {totalChapterList.map((item, index) => {
          const shouldRender = getRangeAroundIndex(
            currentChapterSort as number,
            index
          )
          return (
            <div
              key={item.chapter_id}
              className='relative flex h-full w-full flex-shrink-0 flex-col items-center justify-center'
              ref={setPageRef(item.serial_number || 0)}
              {...getStyles(item.video_pic, shouldRender, item.chapter_id)}
            >
              {shouldRender && <Page id={item.chapter_id} />}
            </div>
          )
        })}
      </VerticalSwiper>
      {totalChapterList.length > 0 &&
        (isAliPlayer ? (
          <AliVideo
            key='video-ali'
            ref={compRef}
            videoCompRef={videoCompRef}
            initSort={initSort}
            preload='auto'
            onVideoEnded={handleEnded}
            onVideoReady={handleReady}
            style={{
              maxHeight: screenH,
            }}
          />
        ) : (
          <NativeVideo
            key='video-native'
            ref={compRef}
            videoCompRef={videoCompRef}
            videoRef={nativeVideoPool.videoRef}
            initSort={initSort}
            preload='auto'
            onVideoEnded={handleEnded}
            onVideoReady={handleReady}
            onPageClick={(status) => {
              updateControlStatus(Boolean(status))
            }}
            style={{
              maxHeight: screenH,
            }}
          />
        ))}
      {/*初始化请求loading*/}
      {/* {isDataLoading && (
        <div className="fixed left-0 top-0 z-[10] h-full w-full z-[999]">
          <div
            className="mx-auto flex max-w-xl items-center justify-center bg-[#000]"
            style={{ height: screenH }}
          >
            <div className="flex items-center justify-center w-[104px] h-[104px] bg-[rgba(31,31,31,0.9)] rounded-[8px]">
              <img
                className="load-animation h-[40px] w-[40px]"
                src="https://v-mps.crazymaplestudios.com/images/e6cae1b0-c6a3-11f0-84ad-6b5693b490dc.png"
                alt=""
              />
            </div>
          </div>
        </div>
      )} */}
      {/*手势指引*/}
      {guideHandStatus && (
        <div
          className='absolute left-0 top-0 z-[11] flex h-[100dvh] h-[100vh] w-full items-center justify-center'
          style={{ pointerEvents: 'none' }}
        >
          <div className='h-[128px] w-[140px] rounded-[8px] bg-[#3d3d3d]'>
            <img
              className='h-full w-full'
              src='https://v-mps.crazymaplestudios.com/images/8acef2f0-c9d9-11f0-84ad-6b5693b490dc.gif'
              alt=''
            />
          </div>
        </div>
      )}
      {/* 底部章节详情弹窗 */}
      <DramaPopup />
      {/* 解锁toast */}
      <UnlockedToast />
      {/* 开始充值弹�?*/}
      <PayModal />
      {/* app引导弹窗 */}
      <AppModal />
      {/* 挽留弹窗 */}
      <RetentionModal />
    </div>
  )
}

export default VideoItems
