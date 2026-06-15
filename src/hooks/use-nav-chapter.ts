import { useCallback, useState } from "react";
import CommonToast from "@/components/common/CommonToast";
import { useReport } from '@/hooks/use-report'
import { useDramaStore } from "@/stores/drama-store";
import { useI18n } from "@/i18n";
import {
  BookPreLoadType,
  ChapterItem,
  ChapterLockStatus,
  ExposeRef,
} from "@/types/drama";
import { useShallow } from "zustand/shallow";
import { useParams, useSearchParams } from "react-router-dom";

interface UseNavChapterOptions {
  /** 章节 */
  chapter?: ChapterItem | BookPreLoadType;
  /** 是否自动解锁 */
  autoLock?: boolean;
}

/**
 * 章节导航Hook的返回值类型
 */
interface UseChapterNavigationReturn {
  /** 导航到指定章节的函数 */
  navigateToChapter: (
    swiperRef: React.RefObject<ExposeRef>,
    options: UseNavChapterOptions,
  ) => void;
  /** 是否正在加载章节数据 */
  isLoading: boolean;
}

/**
 * 章节导航Hook
 * 用于处理章节间的导航逻辑，包括获取章节详情和更新当前章节状态
 * @returns {UseChapterNavigationReturn} 返回导航函数、加载状态
 *
 */
export const useNavChapter = (): UseChapterNavigationReturn => {
  const { t } = useI18n();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const chapterList = useDramaStore.use.chapterList();
  /**
   * 导航到指定章节
   * 清空当前章节，获取新章节数据并更新到store中
   * @param {ExposeRef} swiperRef swiper实例
   * @param {ChapterItem | BookPreLoadType} chapter 目标章节
   * @param {boolean} autoLock 是否需要动画切换,以及自动还是非自动解锁
   * @returns {Promise<ChapterDetailResponse | null>} 返回章节详情数据，失败时返回null
   *
   * @throws {Error} 当失败时抛出错误
   */
  const navigateToChapter = useCallback(
    async (
      swiperRef: React.RefObject<ExposeRef>,
      { chapter, autoLock }: UseNavChapterOptions,
    ) => {
      try {
        const chapterIndex = chapter?.sort || 0;
        const preChapter = chapterList[Math.max(0, chapterIndex - 1)];
        /**判断是否跳章解锁，如果跳章，禁止 */
        if (
          chapter?.is_lock === ChapterLockStatus.LOCKED &&
          preChapter?.is_lock === ChapterLockStatus.LOCKED
        ) {
          CommonToast.show(t("video.not-skip"));
          return;
        }
        swiperRef.current?.goToSlide({
          page: chapterIndex,
          animated: autoLock,
        });
      } catch (error) {
        console.error("导航到章节失败:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [t, chapterList],
  );

  return {
    navigateToChapter,
    isLoading,
  };
};


/**
 * 通过apps_flyer跳转逻辑
 */
interface UseOneLinkReturn {
  /** 导航到指定章节的函数 */
  jumpOneLink: () => void
}

/**
 * oneLink跳转Hook
 * 用于处理oneLink参数配置
 * @returns {UseOneLinkReturn} 返回jump函数
 *
 */
export const useOneLink = (): UseOneLinkReturn => {
  const { userInfo, currentChapter, bookDetail } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      currentChapter: state.currentChapter,
      bookDetail: state.bookDetail,
    }))
  )
  // 从URL参数中获取书籍ID
  const { id } = useParams() as { id: string };
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get('mediaType') || ''
  const { appDownloadReport } = useReport()

  const coverUrlParamsObj = (params: any) => {
    const _result: string[] = []
    for (const key in params) {
      const value = params[key]
      if (value?.constructor === Array) {
        value.forEach((_value: any) => {
          _result.push(`${key}=${_value}`)
        })
      } else {
        _result.push(`${key}=${value}`)
      }
    }
    return _result.join('&')
  }
  /**
   * 导航到oneLink
   * 传递参数
   */
  const jumpOneLink = useCallback(async () => {
    const generateRandomCode = (): string => {
      const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      const length = 6
      const array = new Uint32Array(length)
      crypto.getRandomValues(array)
      return Array.from(array, (x) => chars[x % chars.length]).join('')
    }

    const generateDate = (): string => {
      const now = new Date()
      return `${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`
    }
    appDownloadReport({ _action: 'click' })
    const uid = userInfo.uid || ''
    const chapterId = currentChapter.chapter_id || ''
    const deepLinkValueParams = {
      fromType: 22,
      type: 1001,
      book_type: 1,
      parm1: id,
      chapterId,
      h5_identifier: uid,
    }
    const pageName = id ? 'player' : 'home'
    const sBookId = bookDetail?.s_book_id || ''
    const date = generateDate()
    const randomId = generateRandomCode()
    const c = `h5_${pageName}_${sBookId}_${date}_${randomId}_subscribedpop`//待修改
    const _value = encodeURIComponent(
      `cmsvictor://?${coverUrlParamsObj(deepLinkValueParams)}`
    )
    const oneLink = `https://realshortapp.onelink.me/Zof7?af_xp=custom&pid=H5_drama&c=${c}&af_channel=${mediaType}&af_sub1=${uid}&deep_link_value=${_value}&af_dp=${_value}`
    window.location.href = oneLink
  }, [userInfo.uid, currentChapter.chapter_id, id])

  return {
    jumpOneLink,
  }
}