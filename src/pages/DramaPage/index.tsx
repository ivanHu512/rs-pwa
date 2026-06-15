import { useParams, useNavigate } from "react-router-dom";
import { useI18n } from "@/i18n";
import Swiper from "./components/Swiper";
import {
  useCallback,
  useEffect,
  useState,
  useRef,
  CSSProperties,
  useLayoutEffect,
} from "react";
import { ExposeRef, VideoRef, ChapterLockStatus } from "@/types/drama";
import { useDramaData } from "@/hooks/useDramaData";
import { useVideoPool } from "@/hooks/useVideoPool";
import { usePerformance } from "@/hooks/usePerformance";
import { useNavChapter } from "@/hooks/useNavChapter";
import { useDramaStore } from "@/stores/drama-store";
import { useShallow } from "zustand/shallow";
import { getRangeAroundIndex } from "@/lib/utils";
import { aliOssLoader } from "@/lib/aliOssLoader";
import {
  minisOffShare,
  minisOnShare,
  minisShare,
  TTMinisShareOptions,
} from "@/lib/minisApi";
import Page from "./components/page";
import CommonToast from "@/components/common/CommonToast";
import CommonLoading from "@/components/common/CommonLoading";
import PlayerContainer from "./components/playerContainer/Index";
import ChapterDrawer from "./components/chapterDrawer/Index";
import PayDrawer from "@/components/specific/PayDrawer";
import CoinsUnlockToast from "./components/toasts/CoinsUnlockToast";
import VipUnlockToast from "./components/toasts/VipUnlockToast";
import { NormalPopupRef } from "@/types/common";
import { useReport } from "@/hooks/use-report";
import { v4 as uuidv4 } from "uuid";
import { getRecommendBook } from "@/lib/services/drama";
import { getReportPageName, setPlayerPrePageName } from "@/lib/report";

/** 开始滑动之后的延迟时间，用于快速请求接口 */
const animateDelay = 100;
/**延迟2s, 提示滑动按钮消失 */
const delay = 4000;
const localKeyHand = "hand";

export function DramaPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { navigateToChapter } = useNavChapter();
  /** 防抖定时器引用，用于快速滑动时的防抖处理 */
  const slideChangeTimerRef = useRef<number | null>(null);
  /** 章节详情接口是否请求完成 */
  const loadContentRef = useRef<boolean>(false);
  /** swiper对象 */
  const swiperRef = useRef<ExposeRef>(null);
  /** video挂载的目标对象(存储每一章节) */
  const containerRefs = useRef<Record<string, HTMLDivElement>>({});
  /** 播放器组件引用 */
  const playerCompRef = useRef<VideoRef>(null);
  /** 控制video移动到对应页面 */
  const { videoCompRef, switchToVideo } = useVideoPool();
  /** 是否第一次展示手势引导 */
  const [guideHandStatus, setGuideHandStatus] = useState(false);
  /** 商城drawer实例 */
  const payDrawerRef = useRef<NormalPopupRef>(null);
  /** 是否谈过解锁成功弹窗 */
  const isShowToastStatusRef = useRef<boolean>(false);

  const { playEvent, reportRecommendBooks } = useReport();

  const {
    isApiError,
    enableSwipe,
    chapterList,
    bookDetail,
    currentChapter,
    updateCurrentChapter,
    setOpacity,
    updateTouchClick,
    updateDrawerVisible,
    setShowControls,
  } = useDramaStore(
    useShallow((state) => ({
      isApiError: state.isApiError,
      enableSwipe: state.enableSwipe,
      chapterList: state.chapterList,
      bookDetail: state.bookDetail,
      currentChapter: state.currentChapter,
      updateCurrentChapter: state.updateCurrentChapter,
      setOpacity: state.setOpacity,
      updateTouchClick: state.updateTouchClick,
      updateDrawerVisible: state.updateDrawerVisible,
      setShowControls: state.setShowControls,
    })),
  );
  const shareOptionsRef = useRef<TTMinisShareOptions | null>(null);

  /** 性能埋点 */
  usePerformance({ chapterId: currentChapter?.chapter_id });

  /** loading展示 */
  useEffect(() => {
    if (isApiError) {
      CommonLoading.close();
      return;
    }

    if (currentChapter?.chapter_id) {
      CommonLoading.close();
    } else {
      CommonLoading.show();
    }
    return CommonLoading.close;
  }, [currentChapter?.chapter_id, isApiError]);

  /** 初始化书籍数据 */
  const { handleChapterContent, sortOrder } = useDramaData({
    bookId: id,
    containerRefs,
    switchToVideo,
    navigateHall: () => {
      CommonToast.show(t("video.book-expire"), { wrapperClassName: "z-[99]" });
      navigate("/");
    },
    handleUnlockToast: (isVip?: boolean) => {
      if (isShowToastStatusRef.current) {
        return;
      }
      if (isVip) {
        VipUnlockToast.show();
      } else {
        CoinsUnlockToast.show();
      }
      isShowToastStatusRef.current = true;
    },
  });

  /** 设置初始化章节下标，用于更新videoPool */
  const currentIndexRef = useRef<number>(sortOrder);
  useEffect(() => {
    currentIndexRef.current = sortOrder;
  }, [sortOrder]);

  useEffect(() => {
    if (!id || !bookDetail.book_title) {
      shareOptionsRef.current = null;
      return;
    }

    shareOptionsRef.current = {
      title: bookDetail.book_title,
      desc: bookDetail.special_desc,
      imageUrl: bookDetail.book_pic,
    };
    console.log("shareOptionsRef", shareOptionsRef);
  }, [bookDetail.book_pic, bookDetail.book_title, bookDetail.special_desc, id]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.TTMinis) {
      return;
    }

    let callbackId: string | null = null;

    try {
      callbackId = minisOnShare(() => {
        const shareOptions = shareOptionsRef.current;

        if (!shareOptions) {
          return;
        }

        minisShare(shareOptions).catch((error) => {
          console.error("[minis-share] share failed", error);
        });
      });
    } catch (error) {
      console.error("[minis-share] bind share listener failed", error);
    }

    return () => {
      if (!callbackId) {
        return;
      }

      try {
        minisOffShare(callbackId);
      } catch (error) {
        console.error("[minis-share] unbind share listener failed", error);
      }
    };
  }, []);

  /**
   * 当前视频播放结束, 自动切换下一章
   * @param index 章节下标
   */
  const handleEnded = useCallback(
    (chapterId: string) => {
      /** 播放结束，唤起二部剧 */
      if (chapterId === chapterList[chapterList.length - 1]?.chapter_id) {
        updateDrawerVisible(false);
        getRecommendBook(id).then((res) => {
          const { book_id, book_title = "" } = res?.book || {};
          if (book_id) {
            const currentPageName = getReportPageName(location.pathname);
            setPlayerPrePageName(currentPageName);
            window.shelf_id = 30003;
            navigate(`/drama/${book_id}`, { replace: true });
            CommonToast.show(t("video.recommend", { name: book_title }));
            reportRecommendBooks({
              _action: "toast",
              rec_scene: 21,
              _story_id: book_id,
            });
          }
        });
      } else {
        const chapter = chapterList[currentIndexRef.current + 1];
        if (chapter) {
          navigateToChapter(swiperRef, {
            chapter,
            autoLock: true,
          });
        }
      }
    },
    [
      chapterList,
      updateDrawerVisible,
      // appDownloadReport,
      navigateToChapter,
      id,
    ],
  );

  /**
   * 切换章节触发
   * @param index 章节下标
   */
  const handleSlideChange = useCallback(
    async (index: number, animate?: boolean) => {
      // 清除之前的防抖定时器
      if (slideChangeTimerRef.current) {
        clearTimeout(slideChangeTimerRef.current);
        slideChangeTimerRef.current = null;
      }

      const chapter = chapterList[index];
      if (!chapter) return;

      setShowControls(false);
      setOpacity(false);
      loadContentRef.current = false;

      /**切换视频和播放结束事件上报 */
      const switchVideoAndReportEnd = () => {
        const historyPlayProgress =
          playerCompRef.current?.progressMapRef() || 0;
        playEvent({
          subEventName: "play_end",
          type: "other",
          is_free: currentChapter?.is_lock === ChapterLockStatus.FREE ? 1 : 0,
          process: Math.min(
            100,
            Math.ceil(
              (historyPlayProgress / Number(currentChapter?.duration)) * 100,
            ),
          ),
        });
        const isSupportConnection = "connection" in navigator;
        const customNavigator: NavigatorWithConnection = navigator;
        const currentTime = Date.now();
        window.charge = {
          page_trace_id: uuidv4(),
          time: currentTime,
        };
        playEvent({
          subEventName: "play_enter",
          is_unlock: chapter.is_lock === ChapterLockStatus.LOCKED ? 1 : 2,
          is_first_play_chap: 2,
          video_id: chapter.video_id || "",
          chap_total_duration: chapter.duration || 0,
          _chap_order_id: chapter?.serial_number || 0,
          video_type: chapter.video_type || 1,
          video_clarity: chapter.dpi || 540,
          is_free: chapter.is_lock === ChapterLockStatus.FREE ? 1 : 0,
          action_ts: currentTime,
          ctime: Math.floor(currentTime / 1000),
          page_trace_id: window.charge?.page_trace_id,
          ...(isSupportConnection && {
            _rtt: customNavigator?.connection?.rtt,
            _effectiveType: customNavigator?.connection?.effectiveType,
          }),
        });
        if (!animate) {
          updateCurrentChapter({
            ...chapter,
            sort: index,
          });
        } else {
          if (!loadContentRef.current) {
            updateCurrentChapter(chapter);
          }
        }
        currentIndexRef.current = index;

        switchToVideo?.({
          newContainer: containerRefs.current[chapter.chapter_id],
        });
      };

      // 根据 animate 决定是否延迟执行
      if (animate) {
        slideChangeTimerRef.current = setTimeout(
          switchVideoAndReportEnd,
          animateDelay,
        );
      } else {
        switchVideoAndReportEnd();
      }

      /**记录相应时机*/
      const isSuccess = await handleChapterContent(chapter.chapter_id);
      loadContentRef.current = Boolean(isSuccess);
    },
    [
      chapterList,
      currentChapter,
      setOpacity,
      setShowControls,
      handleChapterContent,
      switchToVideo,
      updateCurrentChapter,
      playEvent,
    ],
  );

  /**
   * 支付成功之后，继续播放
   */
  const handlePlayerPaySuccess = useCallback(() => {
    payDrawerRef.current?.close();
    handleChapterContent(currentChapter?.chapter_id);
    isShowToastStatusRef.current = true;
  }, [currentChapter?.chapter_id, handleChapterContent]);

  /**
   * 等待用户第一张视频资源加载成功，再展示手势引导
   * @param status true：表示直接消失
   */
  const handleReady = useCallback((status?: boolean) => {
    const isHandShow = localStorage.getItem(localKeyHand);
    if (!isHandShow) {
      setGuideHandStatus(Boolean(status));
      localStorage.setItem(localKeyHand, localKeyHand);
      setTimeout(() => {
        setGuideHandStatus(false);
      }, delay);
    } else {
      setGuideHandStatus(false);
    }
  }, []);

  /**
   * 样式计算 - 优化依赖项
   */
  const getStyles = useCallback((cover: string, shouldRender?: boolean) => {
    if (!shouldRender) return {};
    const croppedCover = aliOssLoader({ src: cover, width: 640 });
    return {
      style: {
        backgroundImage: `url(${croppedCover})`,
        backgroundSize: "contain",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "center center",
      } as CSSProperties,
    };
  }, []);

  /**
   * 设置页面ref
   */
  const setPageRef = useCallback((chapterId: string) => {
    return (el: HTMLDivElement | null) => {
      if (el) {
        containerRefs.current[chapterId] = el;
      } else {
        delete containerRefs.current[chapterId];
      }
    };
  }, []);

  /** 部分接口报错 */
  if (isApiError) {
    return (
      <div className="fixed left-0 top-0 z-[999] z-[9] h-full w-full">
        <div className="mx-auto flex h-full w-full max-w-xl flex-col items-center justify-center bg-[#000] px-[48px]">
          <i
            className="block h-[160px] w-[160px] bg-contain bg-no-repeat"
            style={{
              backgroundImage: `url(https://v-mps.crazymaplestudios.com/images/69944f90-e0c2-11f0-84ad-6b5693b490dc.png)`,
            }}
          ></i>
          <div className="mb-[40px] mt-[6px] text-center text-[14px] font-[400] text-white/50">
            {t("toast.network-timeout")}
          </div>
          <button
            className="bg-[#e52e2e] flex h-[40px] items-center justify-center gap-1 rounded-[4px] px-[40px] text-[16px] font-[700] text-white/90"
            onClick={() => {
              if (!navigator.onLine) {
                CommonToast.show(t("toast.network-timeout"));
                return;
              }
              location.reload();
            }}
          >
            {t("video.try-again")}
          </button>
        </div>
      </div>
    );
  }

  if (chapterList.length === 0) {
    return null;
  }

  return (
    <div className="relative h-[100vh] w-full bg-black">
      <Swiper
        ref={swiperRef}
        initialSlide={sortOrder}
        enableSwipe={enableSwipe}
        onSlideChange={handleSlideChange}
        onTouchStart={() => {
          updateTouchClick(false);
          setGuideHandStatus(false);
        }}
        onJudgeClick={(flag) => {
          updateTouchClick(flag);
        }}
      >
        {chapterList.map((item, index) => {
          const shouldRender = getRangeAroundIndex(
            currentChapter?.sort as number,
            index,
          );
          return (
            <div
              key={item.chapter_id}
              className="relative flex h-full w-full flex-shrink-0 flex-col items-center justify-center"
              ref={setPageRef(item.chapter_id)}
              {...getStyles(item.video_pic, shouldRender)}
            >
              {shouldRender && (
                <Page id={item.chapter_id} payDrawerRef={payDrawerRef} />
              )}
            </div>
          );
        })}
      </Swiper>
      <PlayerContainer
        key="video"
        bookId={id as string}
        ref={playerCompRef}
        videoCompRef={videoCompRef}
        initSort={sortOrder}
        preload="auto"
        onVideoEnded={handleEnded}
        onVideoReady={handleReady}
      />
      {/* 底部章节详情弹窗 */}
      <ChapterDrawer swiperRef={swiperRef} />
      {/* 拉起商城列表 */}
      <PayDrawer
        ref={payDrawerRef}
        episodePrice={currentChapter?.unlock_cost}
        onPaySuccess={handlePlayerPaySuccess}
      />
      {/*手势指引*/}
      {guideHandStatus && (
        <div
          className="absolute left-0 top-0 z-[11] flex h-[100dvh] h-[100vh] w-full items-center justify-center"
          style={{ pointerEvents: "none" }}
        >
          <div className="h-[128px] w-[140px] rounded-[8px] bg-[#3d3d3d]">
            <img
              className="h-full w-full"
              src="https://v-mps.crazymaplestudios.com/images/8acef2f0-c9d9-11f0-84ad-6b5693b490dc.gif"
              alt=""
            />
          </div>
        </div>
      )}
    </div>
  );
}
