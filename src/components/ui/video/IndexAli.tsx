'use client'
import { useParams } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import React, {
  CSSProperties,
  forwardRef,
  RefObject,
  startTransition,
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useShallow } from 'zustand/shallow'

import Toast from '@/components/ui/toast'
import { useDoubleClick } from '@/hooks/use-double-click'
import { useReport } from '@/hooks/use-report'
import { pixelViewContent } from '@/lib/pixel-event'
import { progressCache } from '@/lib/progress'
import { uploadHeartBeat } from '@/lib/services/book'
import {
  cn,
  getMobileInfo,
  throttleImmediate,
  visibilityProperties,
} from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import { useCheckoutStore } from '@/stores/checkout-store'
import {
  BookVideoProgressMap,
  ChapterLockStatus,
  VideoPlayBtnTypeEnum,
  VideoPlayProgress,
  VideoRef,
  // VideoAllowed
} from '@/types/drama'
import useAliPlayerSDK from '@/hooks/use-ali-player-sdk'

import ControlBar from './ControlBar'
import PlayerBtn from './PlayerBtn'
import ProgressBar from './ProgressBar'

// const videoMap: Record<VideoAllowed, boolean> = {
//   // [VideoAllowed.ABORT]: true,
//   [VideoAllowed.ALLOW]: true,
// }
const { isSafari1731, isSafari1631 } = getMobileInfo()
const { hidden, visibilityChange } = visibilityProperties()

/**延迟3s, 播控按钮消失 */
const delay = 3000
/**heartbeat上报间隔30s */
const heartDelay = 30000
interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  className?: string
  /** 默认起播章节序号 */
  initSort?: number
  /**当前video组件对象 */
  videoCompRef: RefObject<HTMLDivElement | null>
  /**当前video视频标签实例 */
  // videoRef: any
  /**当前视频id */
  // id: string;
  /**当前视频资源地址 */
  // src: string;
  /**视频总时长 */
  // duration: number;
  /**点击当前页面事件 */
  // onPageClick?: (status?: boolean) => void
  /**播放结束事件 */
  onVideoEnded?: (id: string) => void
  /**资源信息准备事件 */
  onVideoReady?: (status?: boolean) => void
  /**设置video的实例 */
  setItemsRef?: (
    videoId: string,
    chapterId: string
  ) => (element: HTMLVideoElement | null) => void
  /**获取video的实例 */
  getItemsRef?: (videoId: string) => React.RefObject<HTMLVideoElement> | null
}

const Video = forwardRef<VideoRef, VideoProps>(
  (
    {
      className,
      initSort = 0,
      width = '100%',
      height = '100vh',
      videoCompRef,
      // videoRef,
      style,
      onCanPlayThrough,
      onLoadedMetadata,
      onVideoEnded,
      onVideoReady,
      getItemsRef,
      setItemsRef,
      ...otherProps
    },
    ref
  ) => {
    const t = useTranslations()
    const locale = useLocale()
    /** 获取书籍id */
    const { id: bookId } = useParams() as { id: string }
    /** 埋点上报事件 */
    const { playEvent, playerToolReport } = useReport()
    /** 音量区域 */
    const volumeRef = useRef<HTMLDivElement>(null)
    /** 操作进度条状态 */
    const handleSeekRef = useRef<boolean>(false)
    /** 记录是否加载失败 */
    const errorRef = useRef<boolean>(false)
    /** 记录加载失败之后的埋点统计 */
    const errorTrackRef = useRef<boolean>(false)
    /** 记录是否加载失败 */
    // const [opacity, setOpacity] = useState(false);
    /** 记录当前播放时长，避免频繁render */
    const currentTimeRef = useRef<number>(0)
    /** 实时设置进度条播放时长 */
    const [currentTime, setCurrentTime] = useState(0)
    /** 判断视频资源是否加载出基本信息 */
    // const [isLoadMetadata, setIsLoadMetadata] = useState(false)
    /** 控制栏隐藏倒计时句柄 */
    const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null)
    /** 保存所有 playEvent 的参数，用于在 uid 存在时重新上报 */
    const savedPlayEventParamsRef = useRef<Parameters<typeof playEvent>[0][]>(
      []
    )
    const handleTimeUpdateInternalRef = useRef<() => void>(null)
    const isMetaCanPlayRef = useRef<boolean>(true)
    /** 记录退出后台的播放状态 */
    const pageVisibleRef = useRef<number>(0)
    /** 记录是不是切换资源导致的短暂暂停，用于控制按钮的显示 */
    const manualPauseRef = useRef(true)
    /** 判断是否是主动触发播放 */
    const manualPlayRef = useRef<boolean>(false)
    const playTimeRef = useRef<number>(0)
    /** 自动播放失败重试次数 */
    const autoPlayErrorCountRef = useRef<number>(0)
    /** 记录所有视频的播放进度, 初始化从sessionStorage恢复 */
    const getInitialProgressMap = () => {
      if (typeof window === 'undefined') return {}
      try {
        const cached = progressCache.get(bookId)
        if (cached && typeof cached === 'object') {
          return { [bookId]: cached as Record<string, VideoPlayProgress> }
        }
        return {}
      } catch (error) {
        console.warn('Failed to load video progress:', error)
        return {}
      }
    }

    const progressMapRef = useRef<BookVideoProgressMap>(getInitialProgressMap())
    const {
      bookDetail,
      isTouchClick,
      accountInfo,
      drawerVisible,
      showControls,
      showPlayType,
      mutedVisible,
      userInfo,
      updateMutedVisible,
      setShowControls,
      setShowPlayType,
      opacity,
      setOpacity,
      currentChapter,
      updateControlStatus,
      // readRecord,
    } = useDramaStore(
      useShallow((state) => ({
        bookDetail: state.bookDetail,
        isTouchClick: state.isTouchClick,
        accountInfo: state.accountInfo,
        drawerVisible: state.drawerVisible,
        showControls: state.showControls,
        showPlayType: state.showPlayType,
        mutedVisible: state.mutedVisible,
        userInfo: state.userInfo,
        updateMutedVisible: state.updateMutedVisible,
        setShowControls: state.setShowControls,
        setShowPlayType: state.setShowPlayType,
        opacity: state.opacity,
        setOpacity: state.setOpacity,
        currentChapter: state.currentChapter,
        updateControlStatus: state.updateControlStatus,
        // readRecord: state.readRecord,
      }))
    )
    const { openRetentionModal } = useCheckoutStore(
      useShallow((state) => ({
        openRetentionModal: state.openRetentionModal,
      }))
    )
    const { open } = openRetentionModal

    /** 保存currentChapter数据，解决闭包问题 */
    const currentChapterRef = useRef(currentChapter)
    useEffect(() => {
      currentChapterRef.current = currentChapter
    }, [currentChapter])

    /** 保存onVideoEnded，解决闭包问题 */
    const onVideoEndedRef = useRef(onVideoEnded)
    useEffect(() => {
      onVideoEndedRef.current = onVideoEnded
    }, [onVideoEnded])

    /**
     * 上报播放器进度
     */
    const handleUploadHeartBeat = useCallback(
      (cpId?: string) => {
        const chapterId = cpId || currentChapter?.chapter_id
        if (!chapterId) {
          return
        }
        const currentChapterProgress = getChapterProgress()
        const video = videoRef.current
        const time = video?.getCurrentTime() || currentChapterProgress || 0
        if (video) {
          uploadHeartBeat({
            bookId,
            readRecord: JSON.stringify({
              chapterId,
              sec: Math.ceil(time),
            }),
          })
        }
      },
      [currentChapter?.chapter_id, bookId]
    )

    /**每次切换音频，把进度置为0, 判断是否断网
     * 监听页面关闭, 30s心跳上报
     */
    const handleDocumentVisibilitychange = useCallback(() => {
      const video = videoRef.current
      if (!video) return
      // @ts-expect-error - 动态属性访问，用于兼容不同浏览器的可见性API
      const isVisible = !document[hidden]
      if (isVisible) {
        // 从后台返回前台，恢复播放
        video.seek(pageVisibleRef.current)
        manualPlayRef.current = true
        if (currentChapter?.is_lock !== ChapterLockStatus.LOCKED && !open) {
          video.play()
        }
      } else {
        // 进入后台，暂停并保存当前播放时间
        pageVisibleRef.current = video.getCurrentTime()
        video.pause()
      }
    }, [currentChapter?.is_lock, open])

    /**
     * 当 src 变化时，更新上报，重置各种状态,
     */
    useEffect(() => {
      const heartbeatInterval: NodeJS.Timeout = setInterval(() => {
        handleUploadHeartBeat()
      }, heartDelay)
      const leavePageReport = () => {
        handleUploadHeartBeat()
      }
      window.addEventListener('beforeunload', leavePageReport)
      if (!hidden || !visibilityChange) return
      document.addEventListener(
        visibilityChange,
        handleDocumentVisibilitychange
      )
      return () => {
        setCurrentTime(0)
        setOpacity(false)
        // setIsLoadMetadata(false)
        errorTrackRef.current = false
        manualPlayRef.current = false
        manualPauseRef.current = true
        isMetaCanPlayRef.current = true
        handleUploadHeartBeat()
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
        }
        window.removeEventListener('beforeunload', leavePageReport)
        document.removeEventListener(
          visibilityChange,
          handleDocumentVisibilitychange
        )
      }
    }, [
      currentChapter?.url,
      handleUploadHeartBeat,
      handleDocumentVisibilitychange,
    ])

    /**
     * 当 src 变化时，更新播放器视频资源, 上报埋点,
     */
    useEffect(() => {
      if (!currentChapter?.url) return
      saveAndPlayEvent({
        subEventName: 'play_init',
        action_ts: Date.now(),
        ctime: Math.floor(new Date().getTime() / 1000),
        page_trace_id: window.charge?.page_trace_id,
      })
      return () => {
        /** 每次切换视频，先暂停, 重置自动播放错误计数 */
        videoRef.current?.pause()
        autoPlayErrorCountRef.current = 0
      }
    }, [currentChapter?.url])

    /**
     * 组件卸载时清理HLS和定时器实例
     */
    useEffect(() => {
      return () => {
        destroyAliPlayer()
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }, [])

    /**
     * 保存并发送 playEvent，无论 uid 是否存在都触发，如果 uid 不存在则同时保存参数待后续发送
     */
    const saveAndPlayEvent = useCallback(
      (params: Parameters<typeof playEvent>[0]) => {
        if (!userInfo.uid) {
          savedPlayEventParamsRef.current.push(params)
        }
        playEvent(params)
      },
      [userInfo.uid, playEvent]
    )

    /**
     * 在这里重新触发上报逻辑
     */
    useEffect(() => {
      if (!userInfo.uid) {
        return
      }
      if (savedPlayEventParamsRef.current.length > 0) {
        savedPlayEventParamsRef.current.forEach((params) => {
          playEvent(params)
        })
        savedPlayEventParamsRef.current = []
      }
    }, [userInfo.uid, playEvent])

    /**
     * 获取视频加载信息
     * 恢复播放进度
     */
    const handleLoadedMetadata = (
      e?: React.SyntheticEvent<HTMLVideoElement>
    ) => {
      const video = videoRef.current
      if (!video) return

      const vDuration = video.getDuration() || 0
      if (!vDuration || isNaN(vDuration)) {
        return
      }
      const chapterId = currentChapterRef.current?.chapter_id || ''
      console.log('handleLoadedMetadata', chapterId, vDuration)
      /** 执行此次步骤之后，调用play(), 确保浏览器差异 */
      // setIsLoadMetadata(true)

      onVideoReady?.(true)

      const isSupportConnection = 'connection' in navigator
      const customNavigator: NavigatorWithConnection = navigator
      const currentTime = Date.now()
      saveAndPlayEvent({
        subEventName: 'play_load_meta_data',
        is_first: !errorTrackRef.current ? 1 : 0,
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: currentTime,
        ctime: Math.floor(new Date().getTime() / 1000),
        page_trace_id: window.charge?.page_trace_id,
        enter_time_cost: currentTime - Number(window.charge?.time || 0),
        play_time_cost: currentTime - playTimeRef.current,
        ...(isSupportConnection && {
          _rtt: customNavigator?.connection?.rtt,
          _effectiveType: customNavigator?.connection?.effectiveType,
        }),
      })
    }

    /**
     * 播放失败处理逻辑
     * @param isMuted 因为自动播放失败，需要尝试继续播放
     * @description 尝试2次还是失败，则暂停，引导用户进行手动播放，解决自动播放在某些浏览器和系统版本上的兼容性问题
     * */
    const handleAutoplayWasPrevented = (e: any) => {
      console.log('handleAutoplayWasPrevented', e)
      if (e.paramData !== true) {
        if (autoPlayErrorCountRef.current >= 2) {
          manualPauseRef.current = false
          handlePause()
          return
        }
        console.log('自动播放失败', videoRef.current.muted())
        videoRef.current?.play()
        autoPlayErrorCountRef.current += 1
      }
    }

    /**
     * 静音自动播放成功回调
     * @param isMuted 因为开启声音导致播放失败，降级至静音播放会触发，不做失败记录
     * */
    const handleMutedAutoplayWasPrevented = (e: any) => {
      console.log('handleMutedAutoplayWasPrevented', e)
      manualPlayRef.current = false
    }

    /**
     * 3s，播控按钮和进度条消失
     */
    const resetHideControlsCountdown = useCallback(() => {
      if (!drawerVisible) {
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current)
          hideControlsTimerRef.current = null
        }
        if (showControls && showPlayType === VideoPlayBtnTypeEnum.PLAY) {
          hideControlsTimerRef.current = setTimeout(() => {
            setShowControls(false)
          }, delay)
        }
      }
    }, [drawerVisible, showControls, showPlayType, setShowControls])

    useEffect(() => {
      resetHideControlsCountdown()
      updateControlStatus(showControls)
      if (showControls) {
        playerToolReport({ _action: 'show' })
      } else {
        handleSeekRef.current = false
      }
      return () => {
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current)
          hideControlsTimerRef.current = null
        }
      }
    }, [showControls, showPlayType, resetHideControlsCountdown])

    /**
     * 双击控制播放/暂停切换
     * @param flag true: 点击中间的播放按钮触发
     * */
    const handleVideoPlayClick = useCallback(async () => {
      console.log('双击了吗', showPlayType)
      if (!navigator.onLine) {
        Toast.show(t('video.network-error'))
        return
      }
      if (!currentChapter?.url || !videoRef.current) {
        return
      }

      switch (showPlayType) {
        case VideoPlayBtnTypeEnum.PLAY:
          videoRef.current.pause()
          setShowControls(true)
          setShowPlayType(VideoPlayBtnTypeEnum.PAUSE)
          saveAndPlayEvent({
            subEventName: 'play_end',
            is_first: !errorTrackRef.current ? 1 : 0,
            type: 'pause_on',
            process:
              (videoRef.current.getCurrentTime() /
                videoRef.current.getDuration()) *
              100,
            is_free: currentChapter?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
            action_ts: Date.now(),
            ctime: Math.floor(new Date().getTime() / 1000),
          })
          break
        case VideoPlayBtnTypeEnum.PAUSE:
          /** 如果发生错误，重新加载资源 */
          if (errorRef.current) {
            videoRef.current.loadByUrl(`${currentChapter?.url}?t=${Date.now()}`)
          }
          /** 用于解决滑动太快，网络太慢的时候，禁止用户点击播放预加载章节 */
          if (currentChapter?.is_lock === ChapterLockStatus.LOCKED) return
          manualPlayRef.current = true
          videoRef.current.play()
          setShowControls(false)
          setShowPlayType(VideoPlayBtnTypeEnum.PLAY)
          saveAndPlayEvent({
            subEventName: 'play_start',
            is_first: !errorTrackRef.current ? 1 : 0,
            type: 'pause_off',
            is_free: currentChapter?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
            action_ts: Date.now(),
            ctime: Math.floor(new Date().getTime() / 1000),
            page_trace_id: window.charge?.page_trace_id,
          })
          break
      }
    }, [
      showPlayType,
      currentChapter?.url,
      currentChapter?.is_lock,
      saveAndPlayEvent,
    ])

    /**
     * 单击控制按钮的显示
     * 播放状态下，单击可以显示播放按钮
     * 暂停状态下，单击不显示播放按钮
     * 每次单击，控制外侧的导航栏是否显示
     * 如果是滑动，则不触发
     */
    const handleVideoPlayStatus = useCallback(() => {
      if (!isTouchClick) {
        return
      }
      if (!navigator.onLine) {
        Toast.show(t('video.network-error'))
        return
      }
      if (showPlayType !== VideoPlayBtnTypeEnum.PLAY) {
        return
      }
      console.log('单击了吗', showPlayType, showControls)
      setShowControls(!showControls)
      if (!showControls) {
        setCurrentTime(currentTimeRef.current)
      }
    }, [showPlayType, showControls, isTouchClick])

    /**
     * 跳转到指定时间
     * @param time 时间
     */
    const handleSeek = useCallback(
      (time: number) => {
        if (!videoRef.current) return
        videoRef.current.seek(time)
        currentTimeRef.current = time
        setCurrentTime(time)
        // 触发跳转时，重置控制栏倒计时
        setShowControls(true)
        resetHideControlsCountdown()
        handleSeekRef.current = true
      },
      [resetHideControlsCountdown, setShowControls]
    )

    const resetVideoCurrentTime = useCallback(() => {
      videoRef.current?.seek(0)
      currentTimeRef.current = 0
      setCurrentTime(0)
    }, [])

    /**
     * 保存播放进度
     * @param videoId 视频ID
     * @param currentTime 当前播放时长
     * @param duration 视频总时长
     */
    const saveProgress = useCallback(
      (chapterId: string, currentTime: number, duration: number) => {
        const normalizedTime = currentTime < duration - 2 ? currentTime : 0
        const bookData = progressCache.get(bookId) || {}
        const updatedBookData = {
          ...bookData,
          [chapterId]: {
            currentTime: normalizedTime,
          },
        }
        progressCache.set(bookId, updatedBookData)
        progressMapRef.current = {
          ...progressMapRef.current,
          [bookId]: updatedBookData,
        }
      },
      [bookId]
    )

    /**
     * 获取播放进度
     * @return 当前章节已播放时长
     */
    const getChapterProgress = useCallback(() => {
      const chapterId = currentChapterRef.current?.chapter_id || ''
      const historyPlayProgress = progressMapRef.current[bookId]?.[chapterId]
      return historyPlayProgress?.currentTime || 0
    }, [bookId])

    /**
     * 视频播放中事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleTimeUpdateInternal = useCallback(() => {
      const video = videoRef.current
      if (!video) return
      const duration = video.getDuration() || 0
      const time = video.getCurrentTime() || 0
      const chapterId = currentChapter?.chapter_id || ''
      // console.log('handleTimeUpdate', Date.now(), time, duration, showControls, chapterId)
      if (!duration || isNaN(duration)) {
        return
      }
      if (showControls) {
        startTransition(() => {
          setCurrentTime(time)
        })
      }
      currentTimeRef.current = time
      saveProgress(chapterId, time, duration)
    }, [saveProgress, showControls, currentChapter?.chapter_id])

    /** 保存函数，解决闭包问题 */
    useEffect(() => {
      handleTimeUpdateInternalRef.current = handleTimeUpdateInternal
    }, [handleTimeUpdateInternal])

    /**
     * 使用 useMemo 缓存节流函数
     */
    const handleTimeUpdate = useMemo(
      () => throttleImmediate(() => handleTimeUpdateInternalRef.current?.()),
      [currentChapter?.chapter_id]
    )
    useEffect(() => {
      return handleTimeUpdate.cancel
    }, [handleTimeUpdate])

    /**
     * 视频可以开始播放事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleCanPlay = () => {
      console.log('handleCanPlay', currentChapterRef.current?.chapter_id)
      /** 用于解决进入章节加载，阿里播放器不可控因素导致的多次暂停问题 */
      manualPauseRef.current = false
      errorRef.current = false

      /** 滑动太快，可能播放上一章,需要暂停拦截 */
      if (currentChapterRef.current?.is_lock === ChapterLockStatus.LOCKED) {
        manualPauseRef.current = true
        videoRef.current?.pause()
        return
      }

      const isSupportPerformance =
        typeof performance !== 'undefined' &&
        typeof performance.timeOrigin === 'number'
      const isSupportConnection = 'connection' in navigator
      const customNavigator: NavigatorWithConnection = navigator
      const currentTime = Date.now()
      saveAndPlayEvent({
        subEventName: 'play_start',
        type: isMetaCanPlayRef.current ? 'begin' : 'other',
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        is_first: !errorTrackRef.current ? 1 : 0,
        action_ts: currentTime,
        ctime: Math.floor(new Date().getTime() / 1000),
        page_trace_id: window.charge?.page_trace_id,
        enter_time_cost: currentTime - Number(window.charge?.time || 0),
        play_time_cost: currentTime - playTimeRef.current,
        ...(isSupportConnection && {
          _rtt: customNavigator?.connection?.rtt,
          _effectiveType: customNavigator?.connection?.effectiveType,
        }),
        ...(!window.isNotInit &&
          currentChapterRef.current.sort === initSort &&
          isSupportPerformance &&
          isMetaCanPlayRef.current && {
            page_time_cost:
              currentTime - (window.routerTime || performance.timeOrigin || 0),
          }),
      })
      isMetaCanPlayRef.current = false
      pixelViewContent({
        story_id: currentChapterRef.current?.chapter_id || '',
      })
    }

    /**
     * 视频开始播放事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const timerRef = useRef<NodeJS.Timeout | null>(null)
    const handlePlaying = () => {
      console.log(
        'handlePlaying',
        currentChapterRef.current?.chapter_id,
        videoRef.current?.getStatus(),
        videoRef.current?.tag.volume
      )
      if (!navigator.onLine) return

      setShowPlayType(
        videoRef.current?.paused()
          ? VideoPlayBtnTypeEnum.PAUSE
          : VideoPlayBtnTypeEnum.PLAY
      )

      const isMuted = videoRef.current.muted()
      updateMutedVisible(isMuted)

      /**该版本首帧播放会特意放大 */
      if (isSafari1731 || isSafari1631) {
        if (timerRef.current) {
          clearTimeout(timerRef.current)
        }
        timerRef.current = setTimeout(() => {
          setOpacity(true)
        }, 400)
      } else {
        setOpacity(true)
      }
      /** 每次playing做一次上报 */
      handleUploadHeartBeat(currentChapterRef.current?.chapter_id)
      const isSupportConnection = 'connection' in navigator
      const customNavigator: NavigatorWithConnection = navigator
      const currentTime = Date.now()
      saveAndPlayEvent({
        subEventName: 'play_playing',
        is_first: !errorTrackRef.current ? 1 : 0,
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: currentTime,
        ctime: Math.floor(new Date().getTime() / 1000),
        page_trace_id: window.charge?.page_trace_id,
        enter_time_cost: currentTime - Number(window.charge?.time || 0),
        play_time_cost: currentTime - playTimeRef.current,
        ...(isSupportConnection && {
          _rtt: customNavigator?.connection?.rtt,
          _effectiveType: customNavigator?.connection?.effectiveType,
        }),
      })
    }

    /**
     * 视频播放加载中事件
     * 没有资源,说明请求失败或者需要付费
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleWaiting = () => {
      console.log('handleWait', currentChapterRef.current?.chapter_id)
      setShowPlayType(
        currentChapterRef.current?.url
          ? VideoPlayBtnTypeEnum.LOADING
          : VideoPlayBtnTypeEnum.PAUSE
      )
    }
    /**
     * 视频开始播放事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handlePlay = () => {
      console.log(
        'handlePlay',
        currentChapterRef.current?.chapter_id,
        opacity,
        manualPlayRef.current
      )
      if (manualPlayRef.current) {
        setShowPlayType(VideoPlayBtnTypeEnum.PLAY)
      }
    }
    /**
     * 视频播放暂停事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handlePause = () => {
      console.log(
        'handlePause',
        errorRef.current,
        currentChapterRef.current?.chapter_id,
        manualPauseRef.current
      )
      if (!manualPauseRef.current || errorRef.current) {
        setShowControls(true)
        setShowPlayType(VideoPlayBtnTypeEnum.PAUSE)
      }
    }

    /**
     * 视频播放结束事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleEnded = () => {
      console.log('handleEnded')
      handlePause()
      handleUploadHeartBeat(currentChapterRef.current?.chapter_id)
      resetVideoCurrentTime()
      onVideoEndedRef.current?.(currentChapterRef.current?.chapter_id || '')
      saveAndPlayEvent({
        subEventName: 'play_end',
        is_first: !errorTrackRef.current ? 1 : 0,
        type: 'complete',
        process: 100,
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: Date.now(),
        ctime: Math.floor(new Date().getTime() / 1000),
      })
    }
    /**
     * 视频资源加载错误的事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleError = (e: any) => {
      const paramData = e.paramData
      console.log('handleError', e, paramData?.error_msg, paramData)
      errorRef.current = true
      // Toast.show(paramData?.error_code);
      handlePause()
      errorTrackRef.current = true
      if (!videoRef.current) return
      saveAndPlayEvent({
        subEventName: 'play_end',
        type: 'loading_fail',
        errorCode: paramData?.error_code,
        process:
          (videoRef.current.getCurrentTime() / videoRef.current.getDuration()) *
          100,
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: Date.now(),
        ctime: Math.floor(new Date().getTime() / 1000),
      })
    }

    /**
     * 初始化阿里播放器
     */
    const {
      initHandle,
      changeVideoHandle,
      destroyAliPlayer,
      videoRef,
      videoInit,
    } = useAliPlayerSDK({
      onPlayerCreateFinish: (e) => {},
      onLoadedMetadata: handleLoadedMetadata,
      onCanPlay: handleCanPlay,
      onWaiting: handleWaiting,
      onPlay: handlePlay,
      onPause: handlePause,
      onEnded: handleEnded,
      onError: handleError,
      onPlaying: handlePlaying,
      onAutoplayWasPrevented: handleAutoplayWasPrevented,
      onMutedAutoplayWasPrevented: handleMutedAutoplayWasPrevented,
      onTimeUpdate: () => {
        /**
         * 解决loading之后，play事件有概率不触发，在这里进行状态变更
         * m3u8断流或者切片加载慢/没加载出来，iOS原生hls播放器没触发等待，阿里播放器会手动触发等待，但是playing事件不会再次触发, 只能在timeupdate里改变loading状态
         */
        setShowPlayType(
          videoRef.current?.paused()
            ? VideoPlayBtnTypeEnum.PAUSE
            : VideoPlayBtnTypeEnum.PLAY
        )
        handleTimeUpdate()
      },
    })

    /** 如果是会员，需要判断是否过期, 禁止提前播放 */
    const isContinue = useMemo(() => {
      const isVip = accountInfo?.vip_category === 1 && !!accountInfo?.vip_sec
      return (isVip && currentChapter?.over) || !isVip
    }, [currentChapter?.over, accountInfo?.vip_category, accountInfo?.vip_sec])

    /**
     * 在当前章节的时候，自动播放
     * 需要判断条件，付费章节需要等待解锁之后播放
     */
    useEffect(() => {
      // 限时折扣弹窗打开时，不自动播放，避免和弹窗的操作冲突
      if (open) {
        return
      }

      if (
        // isLoadMetadata &&
        // videoInit &&
        currentChapter?.url &&
        currentChapter?.is_lock !== ChapterLockStatus.LOCKED &&
        currentChapter?.play_info &&
        currentChapter?.chapter_id &&
        isContinue
      ) {
        if (!navigator.onLine) {
          Toast.show(t('video.network-error'))
          return
        }

        // const currentChapterProgress = getChapterProgress()
        const { lang } = bookDetail
        const {
          vtt_lang = [],
          video_pic = '',
          screen_mode,
        } = currentChapterRef.current
        const final_lang = lang || locale
        const defaultSubtitleLang =
          final_lang && vtt_lang.includes(final_lang)
            ? `prism_cc_${final_lang}`
            : 'off'

        if (!videoRef.current) {
          console.log(
            '这是初始化视频源',
            currentChapter?.url,
            lang,
            screen_mode,
            currentChapterRef.current
          )
          console.log('进度跳', currentChapter?.playTime)
          const startTime = currentChapter?.playTime || 0
          initHandle({
            url: currentChapter?.url,
            options: {
              cover: video_pic,
              autoplay: true,
              watchStartTime: startTime,
              defaultSubtitleLang,
            },
            appendParams: {
              isMobile: true,
              screen_mode,
              lang: final_lang,
            },
          })
        } else {
          console.log(
            '这是更换视频源',
            videoRef.current.muted(),
            currentChapter?.url,
            vtt_lang,
            screen_mode,
            currentChapterRef.current,
            Date.now()
          )
          changeVideoHandle({
            url: currentChapter?.url,
            options: {
              cover: video_pic,
              startTime: 0,
              defaultSubtitleLang,
              autoplay: true,
              // mute: videoRef.current.muted(),
            },
          })
        }

        console.log(
          'isVip',
          currentChapter?.chapter_id,
          videoRef.current.muted(),
          open,
          Date.now()
        )
        manualPlayRef.current = false
        // videoRef.current.play()

        /** 调用play()之后尝试解除静音 */
        // const isMuted = videoRef.current.muted()
        // if (isMuted) {
        //   videoRef.current.unMute()
        // }

        playTimeRef.current = Date.now()
        saveAndPlayEvent({
          subEventName: 'play_play',
          is_first: !errorTrackRef.current ? 1 : 0,
          is_lock: currentChapter?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
          action_ts: playTimeRef.current,
          ctime: Math.floor(new Date().getTime() / 1000),
          page_trace_id: window.charge?.page_trace_id,
        })
      } else {
        /** 不满足播放条件下，避免因为有声播放失败，导致阿里播放器触发自动播放逻辑 */
        // videoRef.current?.mute()
      }
    }, [
      // isLoadMetadata,
      // videoInit,
      isContinue,
      currentChapter?.is_lock,
      currentChapter?.play_info,
      currentChapter?.url,
      currentChapter?.video_pic,
      currentChapter?.chapter_id,
      open,
    ])

    /**
     * 打开音量
     * @param e React.MouseEvent<HTMLElement> | React.TouchEvent
     */
    const handleVolume = useCallback(() => {
      if (!videoRef.current) return
      /** 兼容不同浏览器针对touch事件的安全策略 */
      const isMuted = videoRef.current.muted()
      if (isMuted) {
        setTimeout(() => {
          videoRef.current.unMute()
          updateMutedVisible(false)
        }, 100)
      }
    }, [updateMutedVisible])

    /**
     * 绑定双击事件
     */
    const { onClick: handleDoubleClick, onTouchEnd: handleDoubleTouch } =
      useDoubleClick({
        onDoubleClick: handleVideoPlayClick,
        onClick: handleVideoPlayStatus,
      })

    /** 主动调用 */
    useImperativeHandle(ref, () => ({
      progressMapRef: progressMapRef.current,
    }))

    /**
     * 样式计算
     */
    const bgStyles = useMemo(
      () => ({
        positionStyle: {
          transform: opacity ? 'none' : 'translateY(99999px)',
          visibility: opacity ? 'visible' : 'hidden',
          // height: opacity ? '100vh' : 0,
          // overflow: opacity ? 'auto' : 'hidden',
        } as CSSProperties,
      }),
      [opacity]
    )

    return (
      <div
        ref={videoCompRef}
        className='relative z-[30] flex h-full w-full items-center justify-center'
        onClick={handleDoubleClick}
        onMouseDown={handleVolume}
        // onTouchStart={(e) => {
        //   handleVolume()
        // }}
        onTouchEnd={(e) => {
          handleDoubleTouch(e)
          handleVolume()
          if (videoRef.current) {
            onVideoReady?.()
          }
        }}
      >
        <div
          className={cn(
            'group relative overflow-hidden',
            'flex items-center justify-center',
            className
          )}
          style={{
            width,
            height,
          }}
        >
          <div
            id='video_player'
            className='flex !h-full !w-full items-center justify-center'
            style={{
              ...style,
              ...bgStyles.positionStyle,
            }}
          ></div>
          {/* 加载状态 */}
          <PlayerBtn
            visible={showControls}
            showPlayType={showPlayType}
            onVideoPlayClick={handleVideoPlayClick}
          />
        </div>
        {/* 进度条以及章节入口 */}
        <ControlBar onVolume={handleVolume} showPlayType={showPlayType}>
          <ProgressBar
            onVolume={handleVolume}
            showPlayType={showPlayType}
            currentTime={currentTime}
            duration={currentChapter?.duration || 0}
            onSeek={handleSeek}
          />
        </ControlBar>
        {/* 解除静音按钮 */}
        {mutedVisible && (
          <div
            ref={volumeRef}
            className={cn(
              'absolute right-[16px] h-[48px] w-[48px]',
              showControls ? 'bottom-[66px]' : 'bottom-[18px]'
            )}
          >
            <i className='block h-full w-full bg-[url(https://v-mps.crazymaplestudios.com/images/bd01c0a0-c4ec-11f0-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat'></i>
          </div>
        )}
      </div>
    )
  }
)
Video.displayName = 'Video'
export default Video
