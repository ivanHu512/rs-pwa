import { useParams, useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { useI18n } from '@/i18n'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useShallow } from 'zustand/shallow'

import Toast from '@/components/ui/toast'
import { usePreloadUrl } from '@/hooks/use-preload-url'
import { useReport } from '@/hooks/use-report'
import { localKeyUid, localKeyVipLocked } from '@/lib/constant'
import { pixelAddCart } from '@/lib/pixel-event'
import {
  getBookDetail,
  getChapterContent,
  getChapterList,
} from '@/lib/services/book'
import { URLManager, getConfigId, getH5mode, getH5Advertise } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'
import { useSwiperStore } from '@/stores/swiper-store'
import {
  BookPreLoadType,
  ChapterH5DetailItem,
  ChapterItem,
  ChapterLockStatus,
  DramaProps,
  storyStatus,
  VipRewardTypeEnum,
  VideoPlayBtnTypeEnum,
  ReadRecordType,
} from '@/types/drama'
const urlManager = new URLManager()
import { v4 as uuidv4 } from 'uuid'
import { getLocalStorage, setLocalStorage } from '@/lib/storageUtils'

type ChangeVideoProps = {
  chapterId: string
  newSort?: string
  chapters?: Array<ChapterItem | BookPreLoadType>
  skip?: boolean
  serialNumber?: number
  playTime?: number
}

type ChapterContentParams = {
  chapterId: string
  autoLock?: boolean
  record?: ReadRecordType
}
/**
 * 初始化短剧数据的自定义hooks
 * @returns 初始化状�?
 */
export const useDramaData = ({
  bookInfo,
  preload = [],
  sort: initSort = 0,
  // readRecord = {},
  switchToVideo,
  containerRefs,
}: DramaProps & {
  containerRefs: React.RefObject<Record<number, HTMLDivElement>>
}) => {
  const router = useRouter()
  const locale = useLocale()
  const { preload: preloadUrl } = usePreloadUrl()
  const { t } = useI18n()
  const { playEvent, currencyChangeReport } = useReport()
  const { id } = useParams() as { id: string }
  const {
    isIapToast,
    isVipToast,
    drawerVisible,
    userInfo,
    chapterList,
    currentChapter,
    updateCurrentChapter,
    initializeBookData,
    updateAccountInfo,
    updateChapterSource,
    // updateDataLoading,
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
    // updateReadRecord,
  } = useDramaStore(
    useShallow((state) => ({
      isIapToast: state.isIapToast,
      isVipToast: state.isVipToast,
      drawerVisible: state.drawerVisible,
      userInfo: state.userInfo,
      chapterList: state.chapterList,
      currentChapter: state.currentChapter,
      updateCurrentChapter: state.updateCurrentChapter,
      initializeBookData: state.initializeBookData,
      updateAccountInfo: state.updateAccountInfo,
      updateChapterSource: state.updateChapterSource,
      // updateDataLoading: state.updateDataLoading,
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
      // updateReadRecord: state.updateReadRecord,
    }))
  )
  const { swiperRef } = useSwiperStore(
    useShallow((state) => ({
      swiperRef: state.swiperRef,
    }))
  )
  const paySuccessInfo = useCheckoutStore((state) => state.paySuccessInfo)
  const isOpenIapSuccess = useCheckoutStore((state) => state.isOpenIapSuccess)
  const vipSuccessModal = useCheckoutStore((state) => state.vipSuccessModal)
  const isUsedRef = useRef<boolean>(false)
  /** 保存 playEvent 的参数，用于�?uid 存在时重新上�?*/
  const savedPlayEventParamsRef = useRef<
    Parameters<typeof playEvent>[0] | null
  >(null)
  /** 控制章节内容请求的中�?*/
  const chapterContentAbortControllerRef = useRef<AbortController | null>(null)
  /** 章节ID到索引的映射，优化查找性能 */
  const chapterIndexMap = useMemo(() => {
    const map = new Map<string, number>()
    chapterList.forEach((chapter, index) => {
      map.set(chapter.chapter_id, index)
    })
    return map
  }, [chapterList])
  /**
   * 初始化设置ISR数据
   * @desc 如果url参数带有cpId,且不是第一个章节id，则不需要初始化数据
   */
  useLayoutEffect(() => {
    const url = new URL(window.location.href)
    const cpId = url.searchParams.get('cpId')
    const isInitChapter =
      preload.find((item) => item.chapter_id === cpId) || !cpId
    initializeBookData({
      ...(bookInfo && { bookInfo }),
      ...(preload.length > 0 && isInitChapter && { chapterItem: preload }),
      isPreviewChapter: Boolean(initSort),
    })
    return () => {
      initializeBookData({
        chapterItem: [],
        isPreviewChapter: false,
      })
      updateCurrentChapter({ sort: 0 } as ChapterItem | BookPreLoadType)
      setShowControls(false)
      updateControlStatus(false)
      setShowPlayType(VideoPlayBtnTypeEnum.PAUSE)
      setOpacity(false)
      updateMutedVisible(false)
    }
  }, [bookInfo, preload, initSort])

  /**
   * 初始化时切换到第一个视�? 判断是不是第一个isr章节
   * initSort = 0 : 没有预告片或者没有免费章�?
   */
  useEffect(() => {
    const url = new URL(window.location.href)
    const cpId = url.searchParams.get('cpId')
    const firstChapterId = chapterList[initSort]?.chapter_id
    console.log('进度跳初始化', initSort, chapterList)
    if (firstChapterId) {
      const playTime = chapterList[initSort]?.playTime || 0
      if (!cpId || cpId === firstChapterId) {
        handleChangeVideo({
          chapterId: firstChapterId,
          newSort: String(initSort),
          playTime,
        })
      } else {
        handleChangeVideo({
          chapterId: firstChapterId,
          skip: true,
          playTime,
        })
      }
    }
  }, [chapterList[initSort]?.chapter_id])

  /**
   * 判断uid是否存在
   */
  useEffect(() => {
    if (!userInfo.uid || !swiperRef) {
      return
    }
    initData()
    if (savedPlayEventParamsRef.current) {
      playEvent(savedPlayEventParamsRef.current)
      savedPlayEventParamsRef.current = null
    }
  }, [userInfo.uid, swiperRef])
  /**
   * 组件卸载时中断未完成的章节内容请�?
   */
  useEffect(() => {
    return chapterContentAbortControllerRef.current?.abort
  }, [])
  /**
   * 初始化获取部分数�?
   */
  const initData = async () => {
    try {
      const chapter_list = await handleChapterList(id)
      if (Array.isArray(chapter_list) && chapter_list.length) {
        const url = new URL(window.location.href)
        const cpId = url.searchParams.get('cpId')
        const chapter = chapter_list[initSort] || preload[initSort]
        const chapterId = cpId || chapter?.chapter_id
        const chapterIndex = chapter_list.findIndex(
          (chap) => chap.chapter_id === chapterId
        )
        if (chapterIndex === -1) {
          swiperRef?.current.goToSlide({ page: 0, animated: true })
          return
        }
        const currentChapter = chapter_list[chapterIndex]
        const preChapter = chapter_list[Math.max(0, chapterIndex - 1)]
        /**判断初始化章节是不是第一�?*/
        if (chapterIndex !== initSort) {
          if (
            currentChapter?.is_lock === ChapterLockStatus.LOCKED &&
            preChapter?.is_lock === ChapterLockStatus.LOCKED
          ) {
            Toast.show(t('video.not-skip'))
            urlManager.setParams(
              { cpId: chapter?.chapter_id, sort: String(initSort) },
              true
            )
            handleChapterContent({ chapterId: chapter?.chapter_id })
            return
          }
          swiperRef?.current.goToSlide({ page: chapterIndex, animated: true })
        } else if (chapterId) {
          console.log('章节列表', chapterId, chapter_list, preload)
          handleChapterContent({ chapterId })
        }
      } else {
        /** 作品已下�?*/
        goHome()
        // updateBookStatus(storyStatus.BOOK_UNPUBLISH)
      }
    } catch (error) {
      updateApiError(true)
      console.error('接口报错', error)
    } finally {
      // updateDataLoading(false)
    }
  }

  const goHome = useCallback(() => {
    const model = getH5mode()
    const configId = getConfigId()
    const { pixel, mediaType } = getH5Advertise()
    const params = new URLSearchParams()
    if (model) params.set('h5mode', model)
    if (configId) params.set('configId', configId)
    if (pixel) params.set('pixel', pixel)
    if (mediaType) params.set('mediaType', mediaType)

    const paramsString = params.toString()
    router.push(`/${locale}${paramsString ? `/?${paramsString}` : ''}`)
    window.routerTime = Date.now()
  }, [])

  /**
   * 支付成功之后自动解锁
   */
  useEffect(() => {
    if (paySuccessInfo) {
      const url = new URL(window.location.href)
      const cpId = url.searchParams.get('cpId')
      cpId && handleChapterContent({ chapterId: cpId })
      id && handleChapterList(id)
    }
  }, [paySuccessInfo])
  /**
   * 预加载ts文件
   */
  useEffect(() => {
    let shotTimer: number
    if (!currentChapter.chapter_id) return
    const chapterIndex = chapterIndexMap.get(currentChapter.chapter_id) ?? -1
    if (chapterIndex === -1) return
    if (chapterIndex !== chapterList.length - 1) {
      const nextChapter = chapterList[chapterIndex + 1]
      if (!isUsedRef.current && nextChapter?.url) {
        shotTimer = setTimeout(() => {
          isUsedRef.current = true
          preloadUrl(nextChapter, id)
        }, 3000)
      }
    }
    return () => {
      clearTimeout(shotTimer)
    }
  }, [id, chapterList, currentChapter.chapter_id, chapterIndexMap])
  /**
   * 每次拉起章节弹窗，请求章节列表接�?
   */
  useEffect(() => {
    if (drawerVisible) {
      id && handleChapterList(id)
    }
  }, [drawerVisible])
  /**
   * @param chapterId 章节id
   */
  const handleChangeVideo = useCallback(
    ({ chapterId, newSort, chapters, skip, playTime }: ChangeVideoProps) => {
      const totalChapterList = chapterList || chapters
      const chapter = totalChapterList.find(
        (item) => item.chapter_id === chapterId
      )
      const url = new URL(window.location.href)
      const sort = newSort || url.searchParams.get('sort')
      if (chapter) {
        if (!skip) {
          const isSupportPerformance =
            typeof performance !== 'undefined' &&
            typeof performance.timeOrigin === 'number'
          const isSupportConnection = 'connection' in navigator
          const customNavigator: NavigatorWithConnection = navigator
          const currentTime = Date.now()
          window.charge = {
            page_trace_id: uuidv4(),
            time: currentTime,
          }
          const playEventParams = {
            subEventName: 'play_enter',
            is_unlock: chapter.is_lock === ChapterLockStatus.LOCKED ? 1 : 2,
            is_first_play_chap: Number(sort) !== initSort ? 2 : 1,
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
            ...(isSupportPerformance && {
              page_time_cost:
                currentTime -
                (window.routerTime || performance.timeOrigin || 0),
            }),
          }
          savedPlayEventParamsRef.current = playEventParams
          playEvent(playEventParams)
          urlManager.setParams(
            {
              cpId: chapterId,
              ...(sort && { sort }),
            },
            true
          )
        }
        switchToVideo?.({
          newContainer: containerRefs.current[chapter?.serial_number || 0],
          chapterId,
          url: chapter.url || '',
          pic: chapter.video_pic || '',
        })
        updateCurrentChapter({ ...chapter, playTime })
      }
    },
    [chapterList]
  )
  /**
   * 获取章节资源
   * @param chapterId 章节ID
   * @param autoLock 是否自动解锁
   */
  const handleChapterContent = useCallback(
    async ({
      chapterId,
      autoLock,
    }: ChapterContentParams): Promise<boolean | undefined> => {
      isUsedRef.current = false
      chapterContentAbortControllerRef.current?.abort()
      const controller = new AbortController()
      chapterContentAbortControllerRef.current = controller
      try {
        const response = await getChapterContent(
          { bookId: id, chapterId },
          { signal: controller.signal }
        )
        if (response) {
          console.log('章节资源信息', chapterId, response)
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
          } = response
          /** 作品已下�?*/
          if (status === storyStatus.BOOK_UNPUBLISH) {
            goHome()
            // updateBookStatus(storyStatus.BOOK_UNPUBLISH)
            return true
          }
          /** 先更新关键状�?*/
          updateChapterSource([response, ...preloadData])
          updateCurrentChapter(response as ChapterItem, true)
          updateAccountInfo({
            coins,
            bonus,
            vip_type,
            vip_sec,
            vip_category,
          })
          /** 延迟非关键操作，避免阻塞主线�?*/
          const uid = getLocalStorage(localKeyUid) || ''
          setTimeout(() => {
            /**
             * 扣费成功判断
             * 条件一: 金币解锁
             * 条件�? 会员解锁, 服务端无法判断，所以状态存本地
             * */
            if (vip_type === VipRewardTypeEnum.NON) {
              if (
                response.is_lock === ChapterLockStatus.UNLOCK &&
                Number(unlock_cost) > 0
              ) {
                !isOpenIapSuccess &&
                  !isIapToast &&
                  updateLockedToastVisible(true)
                updateIapToastStatus(true)
                pixelAddCart({
                  amount: unlock_cost,
                  story_id: id,
                })
                currencyChangeReport({
                  _vc_id: 'vc_01',
                  _change_amount: unlock_cost,
                  _latter_amount: bonus + coins,
                  _change_reason: 'auto_unlock_exp',
                  _chap_id: chapterId,
                  _chap_order_id: serial_number,
                })
                playEvent({
                  subEventName: 'play_unlock',
                  is_unlock: 2,
                  _chap_id: chapterId,
                  _chap_order_id: serial_number,
                  video_type: vip_type,
                  is_free: 0,
                  unlock_type: 1,
                  is_auto_unlock: autoLock ? 1 : 0,
                  vc_exp: unlock_cost,
                })
              }
            } else if (vip_category === 1 && !!vip_sec) {
              !vipSuccessModal?.open &&
                !isVipToast &&
                updateLockedToastVisible(true)
              updateVipToastStatus(true)
            }
            /**
             * 更新会员状�?会员解锁只弹一次提�?
             */
            setLocalStorage(
              localKeyVipLocked,
              JSON.stringify({ [uid]: String(vip_type) })
            )
          }, 0)

          return true
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          console.log('请求被主动取�?', chapterId)
          return
        }
        console.log(error)
        return false
      } finally {
        if (chapterContentAbortControllerRef.current === controller) {
          chapterContentAbortControllerRef.current = null
        }
      }
    },
    [
      id,
      isIapToast,
      isVipToast,
      updateChapterSource,
      updateCurrentChapter,
      updateAccountInfo,
      updateBookStatus,
      updateLockedToastVisible,
      updateIapToastStatus,
      updateVipToastStatus,
      isOpenIapSuccess,
      vipSuccessModal,
      pixelAddCart,
      currencyChangeReport,
      playEvent,
    ]
  )
  /**
   * 获取章节列表
   */
  const handleChapterList = useCallback(
    async (id: string): Promise<Array<ChapterItem>> => {
      const response = await getChapterList(id)
      if (response) {
        const chapter_list = response?.chapter_lists || []
        if (chapter_list.length) {
          initializeBookData({
            chapterItem: chapter_list,
            isPreviewChapter: Boolean(initSort),
          })
        }
        return chapter_list
      } else {
        throw new Error('chapterList error')
      }
    },
    [initializeBookData, initSort]
  )

  return {
    handleChapterContent,
  }
}
