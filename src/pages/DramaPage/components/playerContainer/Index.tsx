import React, {
  CSSProperties,
  forwardRef,
  RefObject,
  startTransition,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useShallow } from "zustand/shallow";
import { useI18n } from "@/i18n";
import CommonToast from "@/components/common/CommonToast";
import { useReport } from "@/hooks/use-report";
import { uploadHeartBeat } from "@/lib/services/book";
import { cn, throttleImmediate } from "@/lib/utils";
import { useDramaStore } from "@/stores/drama-store";
import {
  ChapterLockStatus,
  VideoPlayBtnTypeEnum,
  VideoRef,
} from "@/types/drama";
import useAliPlayer from "@/hooks/use-ali-player";
import { useDoubleClick } from "@/hooks/use-double-click";

import ControlBar from "./ControlBar";
import PlayerBtn from "./PlayerBtn";
import ProgressBar from "./ProgressBar";

const u = navigator.userAgent;
const isAndroid = u.indexOf("Android") > -1 || u.indexOf("Adr") > -1;

/**延迟3s, 播控按钮消失 */
const delay = 3000;
/**heartbeat上报间隔30s */
const heartDelay = 30000;
interface VideoProps extends React.VideoHTMLAttributes<HTMLVideoElement> {
  className?: string;
  /** 书籍id */
  bookId: string;
  /** 默认起播章节序号 */
  initSort?: number;
  /**当前video组件对象 */
  videoCompRef: RefObject<HTMLDivElement>;
  /**播放结束事件 */
  onVideoEnded?: (id: string) => void;
  /**资源信息准备事件 */
  onVideoReady?: (status?: boolean) => void;
}

const PlayerContainer = forwardRef<VideoRef, VideoProps>(
  (
    {
      className,
      bookId,
      width = "100%",
      height = "100vh",
      videoCompRef,
      onVideoEnded,
      onVideoReady,
      initSort,
    },
    ref,
  ) => {
    const { t, locale } = useI18n();
    /** 埋点上报事件 */
    const { playEvent, errorLogReport } = useReport();
    /** 音量区域 */
    const volumeRef = useRef<HTMLDivElement>(null);
    /** 操作进度条状态 */
    const handleSeekRef = useRef<boolean>(false);
    /** 记录是否加载失败 */
    const errorRef = useRef<boolean>(false);
    /** 记录加载失败之后的埋点统计 */
    const errorTrackRef = useRef<boolean>(false);
    /** 记录当前播放时长，避免频繁render */
    const currentTimeRef = useRef<number>(0);
    /** 实时设置进度条播放时长 */
    const [currentTime, setCurrentTime] = useState(0);
    /** 控制栏隐藏倒计时句柄 */
    const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    /** 保存timeupdate函数 */
    const handleTimeUpdateInternalRef = useRef<(() => void) | null>(null);
    /** 记录视频元数据是否可播放 */
    const isMetaCanPlayRef = useRef<boolean>(true);
    /** 记录退出后台的播放状态 */
    const pageVisibleRef = useRef<number>(0);
    /** 记录是不是切换资源导致的短暂暂停，用于控制按钮的显示 */
    const manualPauseRef = useRef(true);
    /** 判断是否是主动触发播放 */
    const manualPlayRef = useRef<boolean>(false);
    const playTimeRef = useRef<number>(0);
    /** 自动播放失败重试次数 */
    const autoPlayErrorCountRef = useRef<number>(0);
    /** 第一次进入播放器加载状态，避免闪屏 */
    const initOpacityRef = useRef<boolean>(false);

    const {
      bookDetail,
      isTouchClick,
      drawerVisible,
      showControls,
      showPlayType,
      mutedVisible,
      updateMutedVisible,
      setShowControls,
      setShowPlayType,
      opacity,
      setOpacity,
      currentChapter,
      updateControlStatus,
      userInfo,
    } = useDramaStore(
      useShallow((state) => ({
        bookDetail: state.bookDetail,
        isTouchClick: state.isTouchClick,
        drawerVisible: state.drawerVisible,
        showControls: state.showControls,
        showPlayType: state.showPlayType,
        mutedVisible: state.mutedVisible,
        updateMutedVisible: state.updateMutedVisible,
        setShowControls: state.setShowControls,
        setShowPlayType: state.setShowPlayType,
        opacity: state.opacity,
        setOpacity: state.setOpacity,
        currentChapter: state.currentChapter,
        updateControlStatus: state.updateControlStatus,
        userInfo: state.userInfo
      })),
    );
    const accountInfo = userInfo?.account;
    const uid = userInfo?.uid;
    /** 保存currentChapter数据，解决闭包问题 */
    const currentChapterRef = useRef(currentChapter);
    useEffect(() => {
      currentChapterRef.current = currentChapter;
    }, [currentChapter]);

    /** 保存onVideoEnded，解决闭包问题 */
    const onVideoEndedRef = useRef(onVideoEnded);
    useEffect(() => {
      onVideoEndedRef.current = onVideoEnded;
    }, [onVideoEnded]);

    /**
     * 上报播放器进度
     */
    const handleUploadHeartBeat = useCallback(
      (cpId?: string) => {
        if (!currentChapter?.chapter_id && !cpId) {
          return;
        }
        const video = videoRef.current;
        const chapterId = cpId || currentChapter?.chapter_id;
        const time = video?.getCurrentTime() || 0;
        uploadHeartBeat({
          bookId,
          readRecord: JSON.stringify({
            chapterId,
            sec: Math.ceil(time),
          }),
        });
      },
      [currentChapter?.chapter_id, bookId],
    );

    /**每次切换音频，把进度置为0, 判断是否断网
     * 监听页面关闭, 30s心跳上报
     */
    const handleDocumentVisibilitychange = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      const isVisible = !document["hidden"];
      if (isVisible) {
        // 从后台返回前台，恢复播放
        video.seek(pageVisibleRef.current);
        manualPlayRef.current = true;
        if (currentChapter?.is_lock !== ChapterLockStatus.LOCKED) {
          video.play();
        }
      } else {
        // 进入后台，暂停并保存当前播放时间
        pageVisibleRef.current = video.getCurrentTime();
        video.pause();
      }
    }, [currentChapter?.is_lock]);

    /**
     * 当 src 变化时，更新上报，重置各种状态,
     */
    useEffect(() => {
      // handleUploadHeartBeat();
      const heartbeatInterval: ReturnType<typeof setTimeout> = setInterval(() => {
        handleUploadHeartBeat();
      }, heartDelay);
      const eventListenerUploadHeartBeat = () => {
        handleUploadHeartBeat();
      };
      window.addEventListener("beforeunload", eventListenerUploadHeartBeat);
      document.addEventListener(
        "visibilitychange",
        handleDocumentVisibilitychange,
      );

      return () => {
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
        }
        window.removeEventListener(
          "beforeunload",
          eventListenerUploadHeartBeat,
        );
        document.removeEventListener(
          "visibilitychange",
          handleDocumentVisibilitychange,
        );
      };
    }, [
      currentChapter?.url,
      handleUploadHeartBeat,
      handleDocumentVisibilitychange,
    ]);

    /**
     * 当 src 变化时，更新播放器视频资源, 上报埋点,
     */
    useEffect(() => {
      if (!currentChapter?.url) return;
      const now = Date.now();
      playEvent({
        subEventName: "play_init",
        action_ts: now,
        ctime: Math.floor(now / 1000),
        page_trace_id: window.charge?.page_trace_id,
      });
      return () => {
        /** 重置进度条播放时长 */
        setCurrentTime(0);
        /** 是否出错 */
        errorTrackRef.current = false;
        /** 主动触发播放 */
        manualPlayRef.current = false;
        /** 记录视频元数据是否可播放 */
        isMetaCanPlayRef.current = true;
        /** 重置自动播放错误计数 */
        autoPlayErrorCountRef.current = 0;
        /** 重置短暂暂停 */
        manualPauseRef.current = true;
        /** 每次切换章节都需要重新隐藏video */
        setOpacity(false);
        /** 每次切换视频，先暂停 */
        videoRef.current?.pause();
      };
    }, [currentChapter?.url]);

    /**
     * 组件卸载时清理HLS和定时器实例
     */
    useEffect(() => {
      return () => {
        destroyAliPlayer();
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, []);

    /**
     * 获取视频加载信息
     * 恢复播放进度
     */
    const handleLoadedMetadata = (
      e?: React.SyntheticEvent<HTMLVideoElement>,
    ) => {
      const video = videoRef.current;
      if (!video) return;

      const vDuration = video.getDuration() || 0;
      if (!vDuration || isNaN(vDuration)) {
        return;
      }
      const chapterId = currentChapterRef.current?.chapter_id || "";
      console.log("handleLoadedMetadata", chapterId, vDuration);

      onVideoReady?.(true);

      const isSupportConnection = "connection" in navigator;
      const customNavigator: NavigatorWithConnection = navigator;
      const currentTime = Date.now();
      playEvent({
        subEventName: "play_load_meta_data",
        is_first: !errorTrackRef.current ? 1 : 0,
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: currentTime,
        ctime: Math.floor(currentTime / 1000),
        page_trace_id: window.charge?.page_trace_id,
        enter_time_cost: currentTime - Number(window.charge?.time || 0),
        play_time_cost: currentTime - playTimeRef.current,
        ...(isSupportConnection && {
          _rtt: customNavigator?.connection?.rtt,
          _effectiveType: customNavigator?.connection?.effectiveType,
        }),
      });
    };

    /**
     * 播放失败处理逻辑
     * @param isMuted 因为自动播放失败，需要尝试继续播放
     * @description 尝试2次还是失败，则暂停，引导用户进行手动播放，解决自动播放在某些浏览器和系统版本上的兼容性问题
     * */
    const handleAutoplayWasPrevented = (e: any) => {
      console.log("handleAutoplayWasPrevented", e);
      if (e.paramData !== true) {
        if (autoPlayErrorCountRef.current >= 2) {
          manualPauseRef.current = false;
          handlePause();
          return;
        }
        console.log("自动播放失败", videoRef.current?.muted());
        videoRef.current?.play();
        autoPlayErrorCountRef.current += 1;
      }
    };

    /**
     * 静音自动播放成功回调
     * @param isMuted 因为开启声音导致播放失败，降级至静音播放会触发，不做失败记录
     * */
    const handleMutedAutoplayWasPrevented = (e: any) => {
      console.log("handleMutedAutoplayWasPrevented", e);
      manualPlayRef.current = false;
    };

    /**
     * 3s，播控按钮和进度条消失
     */
    const resetHideControlsCountdown = useCallback(() => {
      if (!drawerVisible) {
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current);
          hideControlsTimerRef.current = null;
        }
        if (showControls && showPlayType === VideoPlayBtnTypeEnum.PLAY) {
          hideControlsTimerRef.current = setTimeout(() => {
            setShowControls(false);
          }, delay);
        }
      }
    }, [drawerVisible, showControls, showPlayType, setShowControls]);

    useEffect(() => {
      resetHideControlsCountdown();
      updateControlStatus(showControls);
      if (showControls) {
        // playerToolReport({ _action: 'show' })
      } else {
        handleSeekRef.current = false;
      }
      return () => {
        if (hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current);
          hideControlsTimerRef.current = null;
        }
      };
    }, [showControls, showPlayType, resetHideControlsCountdown]);

    /**
     * 双击控制播放/暂停切换
     * @param flag true: 点击中间的播放按钮触发
     * */
    const handleDoubleClickScreenEvent = useCallback(async () => {
      console.log("双击了吗", showPlayType);
      if (!navigator.onLine) {
        CommonToast.show(t("toast.network-timeout"));
        return;
      }
      if (!currentChapter?.url || !videoRef.current) {
        return;
      }

      switch (showPlayType) {
        case VideoPlayBtnTypeEnum.PLAY:
          videoRef.current?.pause();
          setShowControls(true);
          setShowPlayType(VideoPlayBtnTypeEnum.PAUSE);
          playEvent({
            subEventName: "play_end",
            is_first: !errorTrackRef.current ? 1 : 0,
            type: "pause_on",
            process: Math.min(
              100,
              Math.ceil(
                (videoRef.current?.getCurrentTime() /
                  videoRef.current?.getDuration()) *
                  100,
              ),
            ),
            is_free: currentChapter?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
            action_ts: Date.now(),
            ctime: Math.floor(Date.now() / 1000),
          });
          break;
        case VideoPlayBtnTypeEnum.PAUSE:
          /** 如果发生错误，重新加载资源 */
          if (errorRef.current) {
            videoRef.current.loadByUrl(
              `${currentChapter?.url}?t=${Date.now()}`,
            );
          }
          /** 用于解决滑动太快，网络太慢的时候，禁止用户点击播放预加载章节 */
          if (currentChapter?.is_lock === ChapterLockStatus.LOCKED) return;
          manualPlayRef.current = true;
          videoRef.current.play();
          setShowControls(false);
          setShowPlayType(VideoPlayBtnTypeEnum.PLAY);
          playEvent({
            subEventName: "play_start",
            is_first: !errorTrackRef.current ? 1 : 0,
            type: "pause_off",
            is_free: currentChapter?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
            action_ts: Date.now(),
            ctime: Math.floor(Date.now() / 1000),
            page_trace_id: window.charge?.page_trace_id,
          });
          break;
      }
    }, [showPlayType, currentChapter?.url, currentChapter?.is_lock]);

    /**
     * 单击控制按钮的显示
     * 播放状态下，单击可以显示播放按钮
     * 暂停状态下，单击不显示播放按钮
     * 每次单击，控制外侧的导航栏是否显示
     * 如果是滑动，则不触发
     */
    const handleClickScreenEvent = useCallback(() => {
      if (!isTouchClick) {
        return;
      }

      if (!navigator.onLine) {
        CommonToast.show(t("toast.network-timeout"));
        return;
      }

      if (showPlayType !== VideoPlayBtnTypeEnum.PLAY) {
        return;
      }

      console.log("单击了吗", showPlayType, showControls);
      setShowControls(!showControls);

      if (!showControls) {
        setCurrentTime(currentTimeRef.current);
      }
    }, [showPlayType, showControls, isTouchClick]);

    /**
     * 跳转到指定时间
     * @param time 时间
     * @param skip 只做进度条变动，不做播放器进度变动
     */
    const handleSeek = useCallback(
      (time: number, skip?: boolean) => {
        if (!videoRef.current) return;
        if (!skip) {
          videoRef.current.seek(time);
          currentTimeRef.current = time;
        }
        setCurrentTime(time);
        // 触发跳转时，重置控制栏倒计时
        setShowControls(true);
        resetHideControlsCountdown();
        handleSeekRef.current = true;
      },
      [resetHideControlsCountdown, setShowControls],
    );

    /**
     * 视频播放中事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleTimeUpdateInternal = useCallback(() => {
      const video = videoRef.current;
      if (!video) return;
      const duration = video.getDuration() || 0;
      const time = video.getCurrentTime() || 0;
      // console.log('handleTimeUpdate', Date.now(), time, duration, showControls, chapterId)
      if (!duration || isNaN(duration)) {
        return;
      }
      if (showControls) {
        startTransition(() => {
          setCurrentTime(time);
        });
      }
      currentTimeRef.current = time;
    }, [showControls, currentChapter?.chapter_id]);

    /** 保存函数，解决闭包问题 */
    useEffect(() => {
      handleTimeUpdateInternalRef.current = handleTimeUpdateInternal;
    }, [handleTimeUpdateInternal]);

    /**
     * 使用 useMemo 缓存节流函数
     */
    const handleTimeUpdate = useMemo(
      () => throttleImmediate(() => handleTimeUpdateInternalRef.current?.()),
      [currentChapter?.chapter_id],
    );
    useEffect(() => {
      return handleTimeUpdate.cancel;
    }, [handleTimeUpdate]);

    /**
     * 视频可以开始播放事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleCanPlay = () => {
      console.log(
        "handleCanPlay",
        currentChapterRef.current?.chapter_id,
        currentChapterRef.current?.is_lock,
      );
      /** 用于解决进入章节加载，阿里播放器不可控因素导致的多次暂停问题 */
      manualPauseRef.current = false;
      errorRef.current = false;

      /** 滑动太快，可能播放上一章,需要暂停拦截 */
      if (currentChapterRef.current?.is_lock === ChapterLockStatus.LOCKED) {
        manualPauseRef.current = true;
        videoRef.current?.pause();
        return;
      }

      const isSupportPerformance =
        typeof performance !== "undefined" &&
        typeof performance.timeOrigin === "number";
      const isSupportConnection = "connection" in navigator;
      const customNavigator: NavigatorWithConnection = navigator;
      const currentTime = Date.now();
      playEvent({
        subEventName: "play_start",
        type: isMetaCanPlayRef.current ? "begin" : "other",
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
        ...(currentChapterRef.current.sort === initSort &&
          isSupportPerformance &&
          isMetaCanPlayRef.current && {
            page_time_cost:
              currentTime - (window.routerTime || performance.timeOrigin || 0),
          }),
      });
      isMetaCanPlayRef.current = false;
      // pixelViewContent({
      //   story_id: currentChapterRef.current?.chapter_id || '',
      // })
    };

    /**
     * 视频开始播放事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const timerRef = useRef<number | null>(null);
    const handlePlaying = () => {
      console.log(
        "handlePlaying",
        currentChapterRef.current?.chapter_id,
        videoRef.current?.getStatus(),
        videoRef.current?.tag.volume,
      );
      if (!navigator.onLine) return;

      setShowPlayType(
        videoRef.current?.paused()
          ? VideoPlayBtnTypeEnum.PAUSE
          : VideoPlayBtnTypeEnum.PLAY,
      );

      const isMuted = videoRef.current?.muted();
      updateMutedVisible(isMuted);
      if (!initOpacityRef.current && !isAndroid) {
        setTimeout(() => {
          setOpacity(true);
        }, 300);
        initOpacityRef.current = true;
      } else {
        setOpacity(true);
      }
      /** 每次playing做一次上报 */
      handleUploadHeartBeat(currentChapterRef.current?.chapter_id);

      const isSupportConnection = "connection" in navigator;
      const customNavigator: NavigatorWithConnection = navigator;
      const currentTime = Date.now();
      playEvent({
        subEventName: "play_playing",
        is_first: !errorTrackRef.current ? 1 : 0,
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: currentTime,
        ctime: Math.floor(currentTime / 1000),
        page_trace_id: window.charge?.page_trace_id,
        enter_time_cost: currentTime - Number(window.charge?.time || 0),
        play_time_cost: currentTime - playTimeRef.current,
        ...(isSupportConnection && {
          _rtt: customNavigator?.connection?.rtt,
          _effectiveType: customNavigator?.connection?.effectiveType,
        }),
      });
    };

    /**
     * 视频播放加载中事件
     * 没有资源,说明请求失败或者需要付费
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleWaiting = () => {
      console.log("handleWait", currentChapterRef.current?.chapter_id);
      setShowPlayType(
        currentChapterRef.current?.url
          ? VideoPlayBtnTypeEnum.LOADING
          : VideoPlayBtnTypeEnum.PAUSE,
      );
    };
    /**
     * 视频开始播放事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handlePlay = () => {
      console.log(
        "handlePlay",
        currentChapterRef.current?.chapter_id,
        opacity,
        manualPlayRef.current,
      );
      if (manualPlayRef.current) {
        setShowPlayType(VideoPlayBtnTypeEnum.PLAY);
      }
    };
    /**
     * 视频播放暂停事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handlePause = () => {
      console.log(
        "handlePause",
        errorRef.current,
        currentChapterRef.current?.chapter_id,
        manualPauseRef.current,
      );
      if (!manualPauseRef.current || errorRef.current) {
        setShowControls(true);
        setShowPlayType(VideoPlayBtnTypeEnum.PAUSE);
      }
    };

    /**
     * 视频播放结束事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleEnded = () => {
      console.log("handleEnded");
      handlePause();
      handleUploadHeartBeat(currentChapterRef.current?.chapter_id);
      onVideoEndedRef.current?.(currentChapterRef.current?.chapter_id || "");
      setCurrentTime(0);
      playEvent({
        subEventName: "play_end",
        is_first: !errorTrackRef.current ? 1 : 0,
        type: "complete",
        process: 100,
        is_free:
          currentChapterRef.current?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
        action_ts: Date.now(),
        ctime: Math.floor(Date.now() / 1000),
      });
    };
    /**
     * 视频资源加载错误的事件
     * @param e React.SyntheticEvent<HTMLVideoElement>
     */
    const handleError = (e: any) => {
      const paramData = e.paramData;
      console.log("handleError", e, paramData?.error_msg, paramData);
      errorRef.current = true;
      CommonToast.show(paramData?.error_code);
      handlePause();
      errorTrackRef.current = true;
      errorLogReport({
        err_type: "play",
        _err_info: paramData?.display_msg || paramData?.error_msg || e,
      });
    };

    /**
     * 初始化阿里播放器
     */
    const { initHandle, changeVideoHandle, destroyAliPlayer, videoRef } =
      useAliPlayer({
        onPlayerCreateFinish: () => {},
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
              : VideoPlayBtnTypeEnum.PLAY,
          );
          handleTimeUpdate();
        },
      });

    /** 如果是会员，需要判断是否过期, 禁止提前播放 */
    const isContinue = useMemo(() => {
      const isVip = accountInfo?.vip_category === 1 && !!accountInfo?.vip_sec;
      return (isVip && currentChapter?.over) || !isVip;
    }, [currentChapter?.over, accountInfo?.vip_category, accountInfo?.vip_sec]);

    /**
     * 在当前章节的时候，自动播放
     * 需要判断条件，付费章节需要等待解锁之后播放
     */
    useEffect(() => {
      if (
        currentChapter?.url &&
        currentChapter?.is_lock !== ChapterLockStatus.LOCKED &&
        currentChapter?.play_info &&
        currentChapter?.chapter_id &&
        isContinue
      ) {
        if (!navigator.onLine) {
          CommonToast.show(t("toast.network-timeout"));
          return;
        }
        const startTime = currentChapter?.playTime || 0;
        const { lang } = bookDetail;
        const {
          vtt_lang = [],
          video_pic = "",
          screen_mode,
        } = currentChapterRef.current;
        const final_lang = lang || locale;
        const defaultSubtitleLang =
          final_lang && vtt_lang.includes(final_lang)
            ? `prism_cc_${final_lang}`
            : "off";

        console.log(
          "这是视频源",
          currentChapter?.url,
          lang,
          screen_mode,
          currentChapterRef.current,
        );
        if (!videoRef.current) {
          initHandle({
            url: currentChapter?.url,
            options: {
              cover: video_pic,
              autoplay: true,
              watchStartTime: startTime,
              defaultSubtitleLang,
              traceId: String(uid),
            },
            appendParams: {
              isMobile: true,
              screen_mode,
              lang: final_lang,
            },
          });
        } else {
          changeVideoHandle({
            url: currentChapter?.url,
            options: {
              cover: video_pic,
              startTime: 0,
              defaultSubtitleLang,
              autoplay: true,
            },
          });
        }

        console.log(
          "isVip",
          currentChapter?.chapter_id,
          videoRef.current?.muted(),
          Date.now(),
        );

        manualPlayRef.current = false;
        playTimeRef.current = Date.now();

        playEvent({
          subEventName: "play_play",
          is_first: !errorTrackRef.current ? 1 : 0,
          is_lock: currentChapter?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
          action_ts: playTimeRef.current,
          ctime: Math.floor(playTimeRef.current / 1000),
          page_trace_id: window.charge?.page_trace_id,
        });
      }
    }, [
      isContinue,
      currentChapter?.is_lock,
      currentChapter?.play_info,
      currentChapter?.url,
      currentChapter?.video_pic,
      currentChapter?.chapter_id,
    ]);

    /**
     * 打开音量
     * @param e React.MouseEvent<HTMLElement> | React.TouchEvent
     */
    const handleVolume = useCallback(() => {
      if (!videoRef.current) return;
      /** 兼容不同浏览器针对touch事件的安全策略 */
      const isMuted = videoRef.current?.muted();
      if (isMuted) {
        setTimeout(() => {
          videoRef.current.unMute();
          updateMutedVisible(false);
        }, 100);
      }
    }, [updateMutedVisible]);

    /**
     * 绑定双击事件
     */
    const { onClick: handleClick, onTouchEnd: handleTouchEnd } = useDoubleClick(
      {
        onDoubleClick: handleDoubleClickScreenEvent,
        onClick: handleClickScreenEvent,
      },
    );

    /** 主动调用 */
    useImperativeHandle(ref, () => ({
      progressMapRef: () => {
        return videoRef.current?.getCurrentTime() || 0;
      },
    }));

    /**
     * 样式计算
     */
    const bgStyles = useMemo(
      () => ({
        positionStyle: {
          transform: opacity ? "none" : "translateY(9999px)",
          visibility: opacity ? "visible" : "hidden",
        } as CSSProperties,
      }),
      [opacity],
    );

    return (
      <div
        ref={videoCompRef}
        className="relative z-[30] flex h-full w-full items-center justify-center"
        onClick={handleClick}
        onMouseDown={handleVolume}
        onTouchStart={() => {
          handleVolume();
        }}
        onTouchEnd={(e) => {
          handleTouchEnd(e);
          if (videoRef.current) {
            onVideoReady?.();
          }
        }}
      >
        <div
          className={cn(
            "group relative overflow-hidden",
            "flex items-center justify-center",
            className,
          )}
          style={{
            width,
            height,
          }}
        >
          <div
            id="video_player"
            className="flex !h-full !w-full items-center justify-center"
            style={{
              ...bgStyles.positionStyle,
            }}
          ></div>
          {/* 加载状态 */}
          <PlayerBtn
            visible={showControls}
            showPlayType={showPlayType}
            onVideoPlayClick={handleDoubleClickScreenEvent}
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
              "absolute right-[16px] h-[48px] w-[48px]",
              showControls ? "bottom-[66px]" : "bottom-[18px]",
            )}
          >
            <i className="block h-full w-full bg-[url(https://v-mps.crazymaplestudios.com/images/bd01c0a0-c4ec-11f0-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat"></i>
          </div>
        )}
      </div>
    );
  },
);
PlayerContainer.displayName = "PlayerContainer";
export default PlayerContainer;
