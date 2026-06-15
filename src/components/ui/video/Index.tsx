'use client'
import { useParams, useSearchParams } from 'react-router-dom'
import { useI18n } from '@/i18n'
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
import { useHlsController } from '@/hooks/use-hls'
import { useReport } from '@/hooks/use-report'
import { urlChapterSortKey } from '@/lib/constant'
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
import {
  BookVideoProgressMap,
  ChapterLockStatus,
  VideoPlayBtnTypeEnum,
  VideoPlayProgress,
  VideoRef,
  VideoAllowed,
} from '@/types/drama'

import ControlBar from './ControlBar'
import PlayerBtn from './PlayerBtn'
import ProgressBar from './ProgressBar'

const videoMap: Record<VideoAllowed, boolean> = {
  // [VideoAllowed.ABORT]: true,
  [VideoAllowed.ALLOW]: true,
}
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
  videoRef: RefObject<HTMLVideoElement | null>
  /**当前视频id */
  // id: string;
  /**当前视频资源地址 */
  // src: string;
  /**视频总时�?*/
  // duration: number;
  /**点击当前页面事件 */
  onPageClick?: (status?: boolean) => void
  /**播放结束事件 */
  onVideoEnded?: (id: string) => void
  /**资源信息准备事件 */
  onVideoReady?: (status?: boolean) => void
  /**设置video的实�?*/
  setItemsRef?: (
    videoId: string,
    chapterId: string
  ) => (element: HTMLVideoElement | null) => void
  /**获取video的实�?*/
  getItemsRef?: (videoId: string) => React.RefObject<HTMLVideoElement> | null
}

const Video = forwardRef<VideoRef, VideoProps>(
  (
    {
      className,
      initSort = 0,
      width = '100%',
      height = 'auto',
      videoCompRef,
      videoRef,
      style,
      onCanPlayThrough,
      onLoadedMetadata,
      onVideoEnded,
      onPageClick,
      onVideoReady,
      getItemsRef,
      setItemsRef,
      ...otherProps
    },
    ref
  ) => {
    const { t } = useI18n()
    /** 获取书籍id */
    const { id: bookId } = useParams() as { id: string }
    /** 埋点上报事件 */
    const { playEvent, playerToolReport } = useReport()
    /** 音量区域 */
    const volumeRef = useRef<HTMLDivElement>(null)
    /** 操作进度条状�?*/
    const handleSeekRef = useRef<boolean>(false)
    /** 记录是否加载失败 */
    const errorRef = useRef<boolean>(false)
    /** 记录加载失败之后的埋点统�?*/
    const errorTrackRef = useRef<boolean>(false)
    /** 记录是否加载失败 */
    // const [opacity, setOpacity] = useState(false);
    /** 记录当前播放时长，避免频繁render */
    const currentTimeRef = useRef<number>(0)
    /** 实时设置进度条播放时�?*/
    const [currentTime, setCurrentTime] = useState(0)
    /** 控制栏隐藏倒计时句�?*/
    const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    /** 保存所�?playEvent 的参数，用于�?uid 存在时重新上�?*/
    const savedPlayEventParamsRef = useRef<Parameters<typeof playEvent>[0][]>(
      []
    )
    const isMetaCanPlayRef = useRef<boolean>(true)
    /** 记录退出后台的播放状�?*/
    const pageVisibleRef = useRef<number>(0)
    /** 判断是否是主动触发播�?*/
    const manualPlayRef = useRef<boolean>(false)
    const playTimeRef = useRef<number>(0)
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
      duration = 0,
      id = '',
      src = '',
      is_lock,
      play_info,
      over,
      video_pic,
      currentChapter,
      sort,
      // readRecord,
      // updateReadRecord,
    } = useDramaStore(
      useShallow((state) => ({
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
        duration: state.currentChapter.duration,
        id: state.currentChapter.chapter_id,
        src: state.currentChapter.url,
        is_lock: state.currentChapter.is_lock,
        play_info: state.currentChapter.play_info,
        over: state.currentChapter.over,
        video_pic: state.currentChapter.video_pic,
        currentChapter: state.currentChapter,
        sort: state.currentChapter.sort,
        // readRecord: state.readRecord,
        // updateReadRecord: state.updateReadRecord,
      }))
    )
    const { initHls, resetHls, destroyHls } = useHlsController({ videoRef })
    /**
     * 上报播放器进�?
     */
    const handleUploadHeartBeat = useCallback(
      (cpId?: string) => {
        const chapterId = cpId || currentChapter?.chapter_id
        if (!chapterId) {
          return
        }
        const historyPlayProgress = progressMapRef.current[bookId]?.[id]
        const video = videoRef.current
        const time = video?.currentTime || historyPlayProgress?.currentTime || 0

        if (video) {
          uploadHeartBeat({
            bookId,
            readRecord: JSON.stringify({
              chapterId: id,
              sec: Math.ceil(time),
            }),
          })
        }
      },
      [id, bookId]
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
        video.currentTime = pageVisibleRef.current
        manualPlayRef.current = true
        if (is_lock !== ChapterLockStatus.LOCKED) {
          video.play().catch(console.warn)
        }
      } else {
        // 进入后台，暂停并保存当前播放时间
        pageVisibleRef.current = video.currentTime
        video.pause()
      }
    }, [is_lock])
    useEffect(() => {
      resetHls()
      setCurrentTime(0)
      setOpacity(false)
      errorTrackRef.current = false
      manualPlayRef.current = false
      isMetaCanPlayRef.current = true
      const heartbeatInterval: ReturnType<typeof setTimeout> = setInterval(() => {
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
        handleUploadHeartBeat()
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval)
        }
        window.removeEventListener('beforeunload', leavePageReport)
        document.removeEventListener(
          visibilityChange,
          handleDocumentVisibilitychange
        )
        resetHls()
      }
    }, [src, destroyHls, handleUploadHeartBeat])
    /**
     * �?src 变化时，如果 video 元素已存在，重新初始�?HLS
     */
    useEffect(() => {
      if (videoRef.current && src) {
        initHls(videoRef.current, src)
        saveAndPlayEvent({
          subEventName: 'play_init',
          action_ts: Date.now(),
          ctime: Math.floor(new Date().getTime() / 1000),
          page_trace_id: window.charge?.page_trace_id,
        })
      } else if (!src) {
        resetHls()
      }
    }, [src, initHls, resetHls])
    /**
     * 组件卸载时清理HLS和定时器实例
     */
    useEffect(() => {
      window.$video = videoRef.current
      return () => {
        destroyHls?.()
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }
      }
    }, [])
    /**
     * 保存并发�?playEvent，无�?uid 是否存在都触发，如果 uid 不存在则同时保存参数待后续发�?
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
     * 获取视频加载信息,duration
     * 恢复播放进度
     */
    const handleLoadedMetadata = useCallback(
      (e?: React.SyntheticEvent<HTMLVideoElement>) => {
        const video = videoRef.current
        if (!video) return
        const vDuration = video.duration || 0
        if (!vDuration || isNaN(vDuration)) {
          return
        }
        console.log(
          'handleLoadedMetadata',
          id,
          vDuration,
          video.width,
          video.height
        )
        onVideoReady?.(true)
        // const historyPlayProgress = progressMapRef.current[bookId]?.[id]
        // if (historyPlayProgress && video) {
        //   const progress =
        //     historyPlayProgress.currentTime >= vDuration - 1
        //       ? 0
        //       : historyPlayProgress.currentTime
        //   video.currentTime = progress || 0
        // }
        console.log('进度', currentChapter?.playTime);
        video.currentTime = currentChapter?.playTime || 0;
        const isSupportConnection = 'connection' in navigator;
        const customNavigator: NavigatorWithConnection = navigator;
        const currentTime = Date.now()
        saveAndPlayEvent({
          subEventName: 'play_load_meta_data',
          is_first: !errorTrackRef.current ? 1 : 0,
          is_free: is_lock === ChapterLockStatus.FREE ? 1 : 0,
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
        /** 根据后端接口下发，只设置一�?*/
        // updateReadRecord({})
      },
      [id, onVideoReady, is_lock]
    )
    /**
     * 加载信息
     * */
    useEffect(() => {
      if (!videoRef.current) return
      let animationFrameId: any
      /** 缓存情况下，主动获取Metadata */
      if (videoRef.current.readyState >= 1) {
        const executeOnce = () => {
          handleLoadedMetadata()
          cancelAnimationFrame(animationFrameId)
        }
        animationFrameId = requestAnimationFrame(executeOnce)
      }
      return () => {
        if (animationFrameId) {
          cancelAnimationFrame(animationFrameId)
        }
      }
    }, [handleLoadedMetadata])
    /** 如果是会员，需要判断是否过�? 禁止提前播放 */
    const isContinue = useMemo(() => {
      const isVip = accountInfo?.vip_category === 1 && !!accountInfo?.vip_sec
      return (isVip && over) || !isVip
    }, [over, accountInfo?.vip_category, accountInfo?.vip_sec])
    /**
     * 在当前章节的时候，自动播放
     * 需要判断条件，付费章节需要等待解锁之后播�?
     */
    useEffect(() => {
      console.log(
        '--------',
        src,
        is_lock,
        play_info,
        id,
        currentChapter.chapter_id,
        videoRef.current,
        isContinue
      )
      if (
        src &&
        is_lock !== ChapterLockStatus.LOCKED &&
        play_info &&
        id &&
        videoRef.current &&
        isContinue
      ) {
        if (!navigator.onLine) {
          Toast.show(t('video.network-error'))
          return
        }
        console.log('isVip', videoRef.current.muted, id)
        manualPlayRef.current = false
        videoRef.current
          .play()
          .then(() => {
            if (videoRef.current) {
              console.log('muted play success')
              videoRef.current.muted = false
              updateMutedVisible(false)
              videoRef.current.play().catch((e) => dealPlayAllowError(e, true))
            }
          })
          .catch(dealPlayAllowError)
        playTimeRef.current = Date.now()
        saveAndPlayEvent({
          subEventName: 'play_play',
          is_first: !errorTrackRef.current ? 1 : 0,
          is_lock: is_lock === ChapterLockStatus.FREE ? 1 : 0,
          action_ts: playTimeRef.current,
          ctime: Math.floor(new Date().getTime() / 1000),
          page_trace_id: window.charge?.page_trace_id,
        })
      }
    }, [isContinue, is_lock, play_info, id, src, currentChapter.chapter_id])
    /**
     * 播放失败处理逻辑
     * @param isMuted 因为开启声音导致播放失败，不做失败记录
     * */
    const dealPlayAllowError = (e: any, isMuted?: boolean) => {
      console.warn('Failed to play video:', isMuted, e, e.name)
      if (videoMap[e.name as VideoAllowed]) {
        if (videoRef.current) {
          updateMutedVisible(true)
          /**本身就是静音的情况下，如果还会播放失败，则浏览器播放策略更严�?*/
          if (videoRef.current.muted) {
            handlePause()
            return
          }
          videoRef.current.muted = true
          if(!isMuted) {
            manualPlayRef.current = false
          }
          videoRef.current?.play().catch(console.error)
        }
      }
    }
    /**
     * 3s，播控按钮和进度条消�?
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
      onPageClick?.(showControls)
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
     * @param flag true: 点击中间的播放按钮触�?
     * */
    const handleVideoPlayClick = useCallback(async () => {
      console.log('双击了吗')
      if (!navigator.onLine) {
        Toast.show(t('video.network-error'))
        return
      }
      if (!src || !videoRef.current) return
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
              (videoRef.current.currentTime / videoRef.current.duration) * 100,
            is_free: is_lock === ChapterLockStatus.FREE ? 1 : 0,
            action_ts: Date.now(),
            ctime: Math.floor(new Date().getTime() / 1000),
          })
          break
        case VideoPlayBtnTypeEnum.PAUSE:
          if (errorRef.current) {
            videoRef.current.load()
          }
          /** 用于解决滑动太快，网络太慢的时候，禁止用户点击播放预加载章�?*/
          if (is_lock === ChapterLockStatus.LOCKED) return
          manualPlayRef.current = true
          videoRef.current.play().catch(console.warn)
          setShowControls(false)
          setShowPlayType(VideoPlayBtnTypeEnum.PLAY)
          saveAndPlayEvent({
            subEventName: 'play_start',
            is_first: !errorTrackRef.current ? 1 : 0,
            type: 'pause_off',
            is_free: is_lock === ChapterLockStatus.FREE ? 1 : 0,
            action_ts: Date.now(),
            ctime: Math.floor(new Date().getTime() / 1000),
            page_trace_id: window.charge?.page_trace_id,
          })

          break
      }
    }, [showPlayType, src, is_lock, id, saveAndPlayEvent])
    /**
     * 单击控制按钮的显�?
     * 播放状态下，单击可以显示播放按�?
     * 暂停状态下，单击不显示播放按钮
     * 每次单击，控制外侧的导航栏是否显�?
     * 如果是滑动，则不触发
     */
    const handleVideoPlayStatus = useCallback(() => {
      if (!navigator.onLine) {
        Toast.show(t('video.network-error'))
        return
      }
      if (isTouchClick) {
        console.log('单击了吗', showPlayType)
        if (showPlayType === VideoPlayBtnTypeEnum.PLAY) {
          setShowControls(!showControls)
          showControls && setCurrentTime(currentTimeRef.current)
        }
      }
    }, [showPlayType, showControls, isTouchClick])
    /**
     * 跳转到指定时�?
     * @param time 时间
     */
    const handleSeek = useCallback(
      (time: number) => {
        if (!videoRef.current) return
        videoRef.current.currentTime = time
        currentTimeRef.current = time
        setCurrentTime(time)
        // 触发跳转时，重置控制栏倒计�?
        setShowControls(true)
        resetHideControlsCountdown()
        handleSeekRef.current = true
      },
      [resetHideControlsCountdown, setShowControls]
    )

    const resetVideoCurrentTime = useCallback(() => {
      if (!videoRef.current) return
      videoRef.current.currentTime = 0
      currentTimeRef.current = 0
      setCurrentTime(0)
    }, [])

    /**
     * 保存播放进度
     * @param videoId 视频ID
     * @param currentTime 当前播放时长
     * @param duration 视频总时�?
     */
    const saveProgress = useCallback(
      (chapterId: string, currentTime: number, duration: number) => {
        const normalizedTime = currentTime < duration - 1 ? currentTime : 0
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
     * 视频播放中事�?
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleTimeUpdateInternal = useCallback(() => {
      const video = videoRef.current
      if (!video) return
      const duration = video.duration || 0
      const time = video.currentTime || 0
      if (!duration || isNaN(duration)) {
        return
      }
      currentTimeRef.current = time
      if (showControls) {
        startTransition(() => {
          setCurrentTime(time)
        })
      }
      // showControls && setCurrentTime(time);
      saveProgress(id, time, duration)
    }, [saveProgress, showControls, id])
    /**
     * 使用 useMemo 缓存节流函数
     */
    const handleTimeUpdate = useMemo(
      () => throttleImmediate(handleTimeUpdateInternal),
      [handleTimeUpdateInternal]
    )
    useEffect(() => {
      return handleTimeUpdate.cancel
    }, [handleTimeUpdate])
    /**
     * 视频可以开始播放事�?
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleCanPlay = () => {
      console.log('handleCanPlay', id)
      errorRef.current = false

      /** 滑动太快，可能播放上一�?需要暂停拦�?*/
      if (currentChapter?.is_lock === ChapterLockStatus.LOCKED) {
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
        is_free: is_lock === ChapterLockStatus.FREE ? 1 : 0,
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
          sort === initSort &&
          isSupportPerformance &&
          isMetaCanPlayRef.current && {
            page_time_cost:
              currentTime - (window.routerTime || performance.timeOrigin || 0),
          }),
      })
      isMetaCanPlayRef.current = false
      pixelViewContent({
        story_id: id,
      })
    }
    /**
     * 视频开始播放事�?
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const handlePlaying = () => {
      console.log('playing', id, handleSeekRef.current)
      if (!navigator.onLine) return
      const video = videoRef.current
      setShowPlayType(
        video?.paused ? VideoPlayBtnTypeEnum.PAUSE : VideoPlayBtnTypeEnum.PLAY
      )
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
      /** 每次playing做一次上�?*/
      handleUploadHeartBeat(id)
      const isSupportConnection = 'connection' in navigator
      const customNavigator: NavigatorWithConnection = navigator
      const currentTime = Date.now()
      saveAndPlayEvent({
        subEventName: 'play_playing',
        is_first: !errorTrackRef.current ? 1 : 0,
        is_free: is_lock === ChapterLockStatus.FREE ? 1 : 0,
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
     * 视频播放加载中事�?
     * 没有资源,说明请求失败或者需要付�?
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleWaiting = () => {
      console.log('handleWait', id)
      setShowPlayType(
        src ? VideoPlayBtnTypeEnum.LOADING : VideoPlayBtnTypeEnum.PAUSE
      )
    }
    /**
     * 视频开始播放事�?
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handlePlay = () => {
      console.log('handlePlay', id, opacity, manualPlayRef.current)
      if (manualPlayRef.current) {
        setShowPlayType(VideoPlayBtnTypeEnum.PLAY)
      }
    }
    /**
     * 视频播放暂停事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handlePause = () => {
      console.log('pause', id)
      setShowControls(true)
      setShowPlayType(VideoPlayBtnTypeEnum.PAUSE)
    }
    /**
     * 视频播放结束事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleEnded = () => {
      handlePause()
      onVideoEnded?.(id)
      handleUploadHeartBeat(id)
      resetVideoCurrentTime()
      saveAndPlayEvent({
        subEventName: 'play_end',
        is_first: !errorTrackRef.current ? 1 : 0,
        type: 'complete',
        process: 100,
        is_free: is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: Date.now(),
        ctime: Math.floor(new Date().getTime() / 1000),
      })
    }
    /**
     * 视频资源加载错误的事�?
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
      const videoElement = e.currentTarget
      const error = videoElement.error
      console.log('handleError', error)
      // Toast.show(error?.code);
      handlePause()
      errorRef.current = true
      errorTrackRef.current = true
      if (!videoRef.current) return
      saveAndPlayEvent({
        subEventName: 'play_end',
        type: 'loading_fail',
        errorCode: error?.code,
        process:
          (videoRef.current.currentTime / videoRef.current.duration) * 100,
        is_free: is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: Date.now(),
        ctime: Math.floor(new Date().getTime() / 1000),
      })
    }
    /**
     * 打开音量
     * @param e React.MouseEvent<HTMLElement> | React.TouchEvent
     */
    const handleVolume = useCallback(() => {
      if (!videoRef.current) return
      videoRef.current.muted = false
      updateMutedVisible(false)
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
          height: opacity ? '100vh' : 0,
          overflow: opacity ? 'auto' : 'hidden',
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
        // e.stopPropagation()
        // e.preventDefault()
        // handleVolume()
        // }}
        onTouchEnd={(e) => {
          handleDoubleTouch(e)
          if (videoRef.current) {
            handleVolume()
            onVideoReady?.()
          }
        }}
        // style={{
        //   ...bgStyles.positionStyle
        // }}
      >
        <div
          className={cn(
            'group relative flex items-center justify-center overflow-hidden',
            className
          )}
          style={{
            width,
            height,
            // transform: "translateZ(0)",
            // willChange: "transform",
            // opacity: opacity ? 100 : 0,
            // height: opacity ? height : 0,
          }}
        >
          <video
            ref={videoRef}
            id={id}
            poster={video_pic || ''}
            className='h-full w-full object-contain'
            playsInline
            webkit-playsinline='true'
            x5-playsinline='true'
            onLoadedMetadata={handleLoadedMetadata}
            onCanPlay={handleCanPlay}
            onWaiting={handleWaiting}
            onTimeUpdate={handleTimeUpdate}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={handleEnded}
            onError={handleError}
            onPlaying={handlePlaying}
            {...otherProps}
            style={{
              ...style,
              ...bgStyles.positionStyle,
            }}
          />
          {/* 加载状�?*/}
          <PlayerBtn
            visible={showControls}
            showPlayType={showPlayType}
            onVideoPlayClick={handleVideoPlayClick}
          />
        </div>
        {/* 进度条以及章节入�?*/}
        <ControlBar onVolume={handleVolume} showPlayType={showPlayType}>
          <ProgressBar
            onVolume={handleVolume}
            showPlayType={showPlayType}
            currentTime={currentTime}
            duration={duration}
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
            // onClick={e => handleVolume()}
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
