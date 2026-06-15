import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useShallow } from "zustand/shallow";
import { useDramaStore } from '@/stores/drama-store'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useReport } from "@/hooks/use-report";
import {
  getBookDetail,
  getChapterList,
  getChapterContent,
} from "@/lib/services/book";
import {
  BookPreLoadType,
  VipRewardTypeEnum,
  ChapterH5DetailItem,
  ChapterItem,
  ChapterLockStatus,
  DramaProps,
  storyStatus,
  RawBookDetailResponse,
  VideoPlayBtnTypeEnum,
} from "@/types/drama";
import { v4 as uuidv4 } from "uuid";

type ChangeVideoProps = {
  chapterId: string;
  newSort?: string;
  chapters?: Array<ChapterItem | BookPreLoadType>;
  skip?: boolean;
};
/**
 * 初始化短剧数据的自定义hooks
 * @returns 初始化状态
 */
export const useDramaData = ({
  bookId,
  containerRefs,
  switchToVideo,
  navigateHall,
  handleUnlockToast,
}: DramaProps & {
  containerRefs: React.RefObject<Record<string, HTMLDivElement>>;
}) => {
  const {
    playEvent,
    currencyChangeReport,
    checkpointUnlockReport,
  } = useReport();

  const {
    bookDetail,
    isIapToast,
    isVipToast,
    chapterList,
    initializeBookData,
    updateChapterSource,
    updateLockedToastVisible,
    updateApiError,
    updateBookStatus,
    updateIapToastStatus,
    updateVipToastStatus,
    setShowControls,
    setShowPlayType,
    setOpacity,
    updateMutedVisible,
    updateControlStatus,
    updateCurrentChapter,
    updateAccountInfo
  } = useDramaStore(
    useShallow((state) => ({
      bookDetail: state.bookDetail,
      isIapToast: state.isIapToast,
      isVipToast: state.isVipToast,
      chapterList: state.chapterList,
      initializeBookData: state.initializeBookData,
      updateChapterSource: state.updateChapterSource,
      updateLockedToastVisible: state.updateLockedToastVisible,
      updateApiError: state.updateApiError,
      updateBookStatus: state.updateBookStatus,
      updateIapToastStatus: state.updateIapToastStatus,
      updateVipToastStatus: state.updateVipToastStatus,
      setShowControls: state.setShowControls,
      setShowPlayType: state.setShowPlayType,
      setOpacity: state.setOpacity,
      updateMutedVisible: state.updateMutedVisible,
      updateControlStatus: state.updateControlStatus,
      updateCurrentChapter: state.updateCurrentChapter,
      updateAccountInfo: state.updateAccountInfo
    })),
  );

  const {
    paySuccessInfo,
    isOpenIapSuccess,
    vipSuccessModal
  } = useCheckoutStore(
    useShallow((state) => ({
      paySuccessInfo: state.paySuccessInfo,
      isOpenIapSuccess: state.isOpenIapSuccess,
      vipSuccessModal: state.vipSuccessModal
    })),
  )

  const sortOrderRef = useRef<number>(-1);
  
  /** 控制章节内容请求的中断 */
  const chapterContentAbortControllerRef = useRef<AbortController | null>(null);
  
  /** 支付成功之后自动解锁 */
  useEffect(() => {
    if (paySuccessInfo) {
      const url = new URL(window.location.href)
      const cpId = url.searchParams.get('cpId')
      if(cpId) {
        handleChapterContent(cpId)
      }
      if(bookId) {
        handleChapterList(bookId)
      }
    }
  }, [paySuccessInfo])

  /**
   * 判断uid是否存在, uid存在则直接请求章节内容接口, 不存在则等待uid的变化（登录成功后）再请求章节内容接口，并上报play事件
   * 组件卸载时中断未完成的章节内容请求
   */
  useEffect(() => {
    initData();
    return () => {
      sortOrderRef.current = -1;
      chapterContentAbortControllerRef.current?.abort();
      initializeBookData({
        bookInfo: {} as RawBookDetailResponse,
        chapterItem: [],
        isPreviewChapter: false,
      });
      updateCurrentChapter({ sort: 0 } as ChapterItem | BookPreLoadType);
      setShowControls(false);
      updateControlStatus(false);
      setShowPlayType(VideoPlayBtnTypeEnum.PAUSE);
      setOpacity(false);
      updateMutedVisible(false);
      updateApiError(false);
    };
  }, [bookId]);

  /**
   * 初始化时切换到第一个视频, 判断是不是第一个isr章节
   * initSort = 0 | 1 : 没有预告片或者没有免费章节
   */
  useEffect(() => {
    const chapterId = chapterList[sortOrderRef.current]?.chapter_id;
    if (sortOrderRef.current >= 0 && chapterId) {
      handleChangeVideo({
        chapterId,
        newSort: String(sortOrderRef.current),
      });
    }
  }, [chapterList[sortOrderRef.current]?.chapter_id]);

  /**
   * 初始化获取部分数据
   */
  const initData = async () => {
    if (!navigator.onLine) {
      updateApiError(true);
      return;
    }
    try {
      await handleH5BookDetail();
      const chapter_list = await handleChapterList(bookId);
      if (Array.isArray(chapter_list) && chapter_list.length) {
        const sortOrder = sortOrderRef.current >= 0 ? sortOrderRef.current : 0;
        handleChapterContent(chapter_list[sortOrder]?.chapter_id);
      } else {
        /** 作品已下架 */
        navigateHall?.();
      }
    } catch (error) {
      updateApiError(true);
      console.error("接口报错", error);
    } finally {
      // updateDataLoading(false)
    }
  };

  /**
   * @param chapterId 章节id
   */
  const handleChangeVideo = useCallback(
    ({ chapterId, newSort, chapters, skip }: ChangeVideoProps) => {
      const totalChapterList = chapterList || chapters;
      const chapter = totalChapterList.find(
        (item) => item.chapter_id === chapterId,
      );
      if (chapter) {
        const isSupportPerformance =
          typeof performance !== "undefined" &&
          typeof performance.timeOrigin === "number";
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
          is_first_play_chap: 1,
          video_id: chapter.video_id || "",
          chap_total_duration: chapter.duration || 0,
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
          ...(isSupportPerformance && {
            page_time_cost:
              currentTime - (window.routerTime || performance.timeOrigin || 0),
          }),
        });
        switchToVideo?.({
          newContainer: containerRefs.current?.[chapterId] ?? null,
        });
        updateCurrentChapter(chapter);
      }
    },
    [chapterList],
  );

  /**
   * 获取章节资源
   * @param chapterId 章节ID
   * @param autoLock 是否自动解锁
   */
  const handleChapterContent = useCallback(
    async (
      chapterId?: string,
      autoLock?: boolean,
    ): Promise<boolean | undefined> => {
      if (!bookId || !chapterId) {
        return;
      }
      chapterContentAbortControllerRef.current?.abort();
      const controller = new AbortController();
      chapterContentAbortControllerRef.current = controller;
      try {
        const response = await getChapterContent(
          { bookId, chapterId },
          { signal: controller.signal },
        );
        if (response) {
          console.log("章节资源信息", chapterId, response);
          const {
            preLoad: preloadData = [],
            account: {
              coins = 0,
              bonus = 0,
              vip_type,
              vip_sec,
              vip_category,
            } = {},
            serial_number = 0,
            unlock_cost = 0,
            status,
          } = response;
          /** 作品已下架 */
          if (status === storyStatus.BOOK_UNPUBLISH) {
            navigateHall?.();
            return true;
          }
          /** 先更新关键状态 */
          updateChapterSource([response, ...preloadData]);
          updateCurrentChapter(response as ChapterItem, true);
          updateAccountInfo({
            coins,
            bonus,
            vip_type,
            vip_sec,
            vip_category,
          });
          /** 延迟非关键操作，避免阻塞主线程 */
          // const uid = getLocalStorage(localKeyUid) || ''
          setTimeout(() => {
            /**
             * 扣费成功判断
             * 条件一: 金币解锁
             * 条件二: 会员解锁, 服务端无法判断，所以状态存本地
             * */
            if (vip_type === VipRewardTypeEnum.NON) {
              if (
                response.is_lock === ChapterLockStatus.UNLOCK &&
                Number(unlock_cost) > 0
              ) {
                handleUnlockToast?.();
                // pixelAddCart({
                //   amount: unlock_cost,
                //   story_id: id,
                // })
                currencyChangeReport({
                  _vc_id: "vc_01",
                  _change_amount: unlock_cost,
                  _latter_amount: bonus + coins,
                  _change_reason: "auto_unlock_exp",
                });
                checkpointUnlockReport({
                  is_unlock: ChapterLockStatus.UNLOCK,
                  video_type: vip_type,
                  is_auto_unlock: 1,
                  vc_exp: unlock_cost,
                });
              }
            } else if (vip_category === 1 && !!vip_sec) {
              handleUnlockToast?.(true);
            }
          }, 0);
          return true;
        }
      } catch (error: any) {
        if (
          error?.name === "CanceledError" ||
          error?.name === "AbortError" ||
          error?.code === "ERR_CANCELED"
        ) {
          return;
        }
        console.log(error);
        return false;
      } finally {
        if (chapterContentAbortControllerRef.current === controller) {
          chapterContentAbortControllerRef.current = null;
        }
      }
    },
    [
      bookId,
      isIapToast,
      isVipToast,
      updateChapterSource,
      updateCurrentChapter,
      // updateAccountInfo,
      updateBookStatus,
      updateLockedToastVisible,
      updateIapToastStatus,
      updateVipToastStatus,
      // isOpenIapSuccess,
      // vipSuccessModal,
      // pixelAddCart,
      currencyChangeReport,
      // playEvent,
    ],
  );

  /**
   * 获取章节列表
   */
  const handleChapterList = useCallback(
    async (id?: string): Promise<Array<ChapterItem>> => {
      const response = await getChapterList(id);
      if (response) {
        const chapter_list = response?.chapter_lists || [];
        if (chapter_list.length) {
          initializeBookData({
            chapterItem: chapter_list,
          });
        }
        return chapter_list;
      } else {
        throw new Error("chapterList error");
      }
    },
    [initializeBookData],
  );

  /**
   * 获取书籍详情以及预加载章节
   */
  const handleH5BookDetail = useCallback(async () => {
    const response = await getBookDetail(bookId);
    if (!response || response?.status === storyStatus.BOOK_UNPUBLISH) {
      navigateHall?.();
      return;
    }
    const {
      previewChapter,
      firstChapter,
      screen_mode,
      readRecord,
      paid_start = 1,
      chapter_count = 1,
    } = response || {};
    const chapterItems: Array<ChapterItem | BookPreLoadType> = [];

    if (readRecord?.chapterId) {
      const {
        chapterId,
        play_info = "",
        video_pic = "",
        serialNumber = 1,
        vtt_lang,
        is_lock = ChapterLockStatus.FREE,
        sec = 0,
        video_id,
      } = readRecord;
      sortOrderRef.current = previewChapter ? serialNumber : serialNumber - 1;

      const beforeCurrentItems = Array.from(
        { length: sortOrderRef.current },
        () => ({}) as BookPreLoadType,
      );

      chapterItems.push(...beforeCurrentItems, {
        chapter_id: chapterId,
        serial_number: serialNumber,
        is_lock,
        play_info,
        video_pic,
        unlock_cost: 0,
        duration: 0,
        vtt_lang,
        playTime: sec,
        video_id,
      });
    } else {
      sortOrderRef.current = previewChapter && firstChapter ? 1 : 0;
      /** 根据规则定义字段 */
      const transformChapter = (
        chapter: BookPreLoadType | ChapterItem,
        isFirstChapter: boolean,
        sortOrder: number,
      ) => {
        return {
          ...chapter,
          is_lock: chapter?.is_lock || ChapterLockStatus.FREE,
          play_info: isFirstChapter ? chapter.play_info : "",
          sort: sortOrder,
          screen_mode,
        };
      };
      if (previewChapter) {
        const isFirstChapterAvailable = !!firstChapter;
        chapterItems.push(
          transformChapter(previewChapter, !isFirstChapterAvailable, 0),
        );
      }
      if (firstChapter) {
        chapterItems.push(
          transformChapter(firstChapter, true, sortOrderRef.current),
        );
      }
    }
    const isPreviewChapter = !!previewChapter;
    /** 获取最后一个免费章节 */
    const free_last =
      !isPreviewChapter && paid_start === 1 ? null : paid_start - 1;
    initializeBookData({
      ...(response && {
        bookInfo: { ...response, free_last, last_ep: chapter_count },
      }),
      ...(chapterItems.length > 0 && { chapterItem: chapterItems }),
      isPreviewChapter,
    });
  }, [bookId, initializeBookData, navigateHall]);

  return {
    handleChapterContent,
    handleChapterList,
    sortOrder: sortOrderRef.current,
  };
};
