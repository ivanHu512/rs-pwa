import { create } from 'zustand'
import { StoreApi, UseBoundStore } from 'zustand'

import {
  localKeyDevId,
  localKeyUid,
  localKeyUser,
  sessionKey,
} from '@/lib/constant'
import { COOKIE_KEY_DEVID, COOKIE_KEY_UID, cookieSet } from '@/lib/cookies'
import { formatDefinition } from '@/lib/play'
import { getLocalStorage, setLocalStorage } from '@/lib/storageUtils'
import {
  AccountInfo,
  BookPreLoadType,
  ChapterItem,
  RawBookDetailResponse,
  storyStatus,
  UserInfo,
  VideoPlayBtnTypeEnum,
  VipRewardTypeEnum,
  ReadRecordType,
} from '@/types/drama'

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S
) => {
  const store = _store as WithSelectors<typeof _store>
  store.use = {}
  for (const k of Object.keys(store.getState())) {
    ;(store.use as any)[k] = () => store((s) => s[k as keyof typeof s])
  }

  return store
}
type State = {
  isPreviewChapter: boolean
  opacity: boolean
  preloadImageCount: number
  bookStatus: storyStatus
  isTouchClick: boolean
  isApiError: boolean
  appModalVisible: boolean
  vipDrawerVisible: boolean
  // chapterIndexMap: Map<string, number>;
  enableSwipe: boolean
  isDataLoading: boolean
  lockedToastVisible: boolean
  mutedVisible: boolean
  accountInfo: AccountInfo
  drawerVisible: boolean
  stripeModal: {
    open: boolean
    clientSecret: string
  }
  controlStatus: boolean
  isLoading: boolean
  currentChapter: Partial<ChapterItem | BookPreLoadType>
  userInfo: UserInfo
  bookDetail: RawBookDetailResponse
  chapterList: Array<ChapterItem | BookPreLoadType>
  scrollTopStatus?: boolean
  showControls: boolean
  showPlayType: VideoPlayBtnTypeEnum
  isIapToast: boolean
  isVipToast: boolean
  readRecord: ReadRecordType
}

type DramaStore = State & {
  // Actions
  updateApiError: (isApiError: boolean) => void
  setShowControls: (showControls: boolean) => void
  setShowPlayType: (showPlayType: VideoPlayBtnTypeEnum) => void
  setEnableSwipe: (enableSwipe: boolean) => void
  setStripeModal: (stripeModal: any) => void
  updateControlStatus: (controlStatus: boolean) => void
  setIsLoading: (isLoading: boolean) => void
  updateAccountInfo: (accountInfo: AccountInfo) => void
  updateDrawerVisible: (drawerVisible: boolean) => void
  updateVipDrawerVisible: (vipDrawerVisible: boolean) => void
  updateCurrentChapter: (
    item: ChapterItem | BookPreLoadType,
    over?: boolean
  ) => void
  updateScrollTopStatus: (scrollTopStatus: boolean) => void
  setUserInfo: (userInfo: UserInfo, session: string) => void
  updateChapterSource: (
    chapterItem: Array<ChapterItem | BookPreLoadType>
  ) => void
  updateMutedVisible: (status: boolean) => void
  updateBookStatus: (status: storyStatus) => void
  updateAppModalVisible: (appModalVisible: boolean) => void
  updateLockedToastVisible: (status: boolean) => void
  updateDataLoading: (status: boolean) => void
  initializeBookData: ({
    bookInfo,
    chapterItem,
    isPreviewChapter,
  }: {
    bookInfo?: RawBookDetailResponse
    chapterItem?: Array<ChapterItem | BookPreLoadType>
    isPreviewChapter?: boolean
  }) => void
  updateTouchClick: (status: boolean) => void
  updateIapToastStatus: (isIapToast: boolean) => void
  updateVipToastStatus: (isVipToast: boolean) => void
  updatePreloadImageCount: (preloadImageCount: number) => void
  updateReadRecord: (readRecord: ReadRecordType) => void
  setOpacity: (opacity: boolean) => void
}

export const useDrama = create<DramaStore>((set) => ({
  // Initial state
  readRecord: {},
  isPreviewChapter: false,
  opacity: false,
  preloadImageCount: 3,
  isIapToast: false,
  isVipToast: false,
  bookStatus: storyStatus.NORMAL,
  isTouchClick: true,
  isApiError: false,
  showControls: false,
  showPlayType: VideoPlayBtnTypeEnum.PAUSE,
  appModalVisible: false,
  vipDrawerVisible: false,
  lockedToastVisible: false,
  // chapterIndexMap: new Map(),
  enableSwipe: true,
  isDataLoading: false,
  mutedVisible: false,
  accountInfo: {
    coins: 0,
    bonus: 0,
    vip_type: VipRewardTypeEnum.NON,
  },
  drawerVisible: false,
  chapterList: [],
  bookDetail: {
    book_id: '',
    book_title: '',
    book_pic: '',
    special_desc: '',
    chapter_count: 0,
  },
  currentChapter: {
    sort: 0,
  },
  isLoading: false,
  controlStatus: false,
  stripeModal: {
    open: false,
    clientSecret: '',
  },
  userInfo: {},
  updateReadRecord: (readRecord: ReadRecordType) => set({ readRecord }),
  setOpacity: (opacity: boolean) => set({ opacity }),
  updatePreloadImageCount: (preloadImageCount: number) =>
    set({ preloadImageCount }),
  updateIapToastStatus: (isIapToast: boolean) => set({ isIapToast }),
  updateVipToastStatus: (isVipToast: boolean) => set({ isVipToast }),
  updateBookStatus: (bookStatus: storyStatus) => set({ bookStatus }),
  updateTouchClick: (isTouchClick: boolean) => set({ isTouchClick }),
  setShowControls: (showControls: boolean) => set({ showControls }),
  setShowPlayType: (showPlayType: VideoPlayBtnTypeEnum) =>
    set({ showPlayType }),
  setEnableSwipe: (enableSwipe: boolean) => set({ enableSwipe }),
  setStripeModal: (stripeModal: any) => set({ stripeModal }),
  updateControlStatus: (controlStatus: boolean) => set({ controlStatus }),
  setIsLoading: (isLoading: boolean) => set({ isLoading }),
  updateLockedToastVisible: (lockedToastVisible: boolean) =>
    set({ lockedToastVisible }),
  updateDrawerVisible: (drawerVisible: boolean) => set({ drawerVisible }),
  updateAppModalVisible: (appModalVisible: boolean) => set({ appModalVisible }),
  updateVipDrawerVisible: (vipDrawerVisible: boolean) =>
    set({ vipDrawerVisible }),
  updateAccountInfo: (accountInfo: AccountInfo) => {
    set((state) => {
      const userInfo = state.userInfo
      userInfo.account = {
        ...userInfo.account,
        ...accountInfo,
      }
      setLocalStorage(localKeyUser, JSON.stringify(userInfo))
      return {
        userInfo,
        accountInfo: {
          ...state.accountInfo,
          ...accountInfo,
        },
      }
    })
  },
  updateScrollTopStatus: (scrollTopStatus: boolean) => set({ scrollTopStatus }),
  updateMutedVisible: (status: boolean) => {
    set({
      mutedVisible: status,
    })
  },
  updateDataLoading: (status: boolean) => {
    set({
      isDataLoading: status,
    })
  },
  updateApiError: (isApiError: boolean) => set({ isApiError }),
  setUserInfo: (userInfo: UserInfo = {}, session = '') => {
    set((state) => {
      /** 避免apple登陆落地时，用户信息被游客初始详情接口覆盖 */
      if (
        state.userInfo.uid &&
        state.userInfo.sid !== 0 &&
        userInfo.sid === 0
      ) {
        return { userInfo: state.userInfo }
      }
      setLocalStorage(localKeyUser, JSON.stringify(userInfo))
      setLocalStorage(localKeyUid, JSON.stringify(userInfo.uid || 0))
      setLocalStorage(sessionKey, session)

      // 同步到 cookie
      cookieSet(COOKIE_KEY_UID, String(userInfo.uid || 0))
      const devId = getLocalStorage(localKeyDevId)
      if (devId) {
        cookieSet(COOKIE_KEY_DEVID, devId)
      }
      if (session) {
        cookieSet(sessionKey, session)
      }
      return {
        userInfo,
        accountInfo: userInfo.account || {
          coins: 0,
          bonus: 0,
          vip_type: 0,
        },
      }
    })
  },
  initializeBookData: ({
    bookInfo,
    chapterItem = [],
    isPreviewChapter,
  }: {
    bookInfo?: RawBookDetailResponse
    chapterItem?: Array<ChapterItem | BookPreLoadType>
    isPreviewChapter?: boolean
  }) => {
    set((state) => {
      const defaultChapterList = state.chapterList
      const chapterMap = new Map(
        defaultChapterList.map((item) => [item.chapter_id, item])
      )
      const newChapterList = chapterItem.map((chapter, index) => {
        const useProps = findUsedChapterProps(chapter)
        const hitChapter = chapterMap.get(useProps.chapter_id)
        return {
          ...hitChapter,
          ...useProps,
          sort: index,
        }
      })
      return {
        bookDetail: bookInfo || state.bookDetail,
        chapterList: newChapterList,
        isPreviewChapter,
      }
    })
  },
  updateCurrentChapter: (
    currentChapter: ChapterItem | BookPreLoadType,
    over?: boolean
  ) => {
    const {
      url,
      chapter_id,
      serial_number = 1,
      is_lock,
      play_info,
      duration,
      unlock_cost = 0,
      video_type,
      video_pic,
      video_id,
      t_book_id,
      vtt_lang = [],
      screen_mode = 1,
      playTime: initPlayTime = 0,
    } = currentChapter
    set((state) => {
      const playTime =
        state.currentChapter?.chapter_id === chapter_id
          ? state.currentChapter?.playTime
          : initPlayTime
      const sort = state.isPreviewChapter ? serial_number : serial_number - 1
      const final_screen_mode = state.currentChapter.screen_mode || screen_mode
      const final_play_info =
        state.currentChapter.chapter_id !== chapter_id ||
        !state.currentChapter.play_info
          ? play_info
          : state.currentChapter.play_info
      const itemUrls = formatDefinition(final_play_info) as Book.IPlayItem
      return {
        currentChapter: {
          url,
          chapter_id,
          serial_number,
          is_lock,
          duration,
          unlock_cost,
          vtt_lang,
          video_type,
          video_pic,
          play_info: final_play_info,
          screen_mode: final_screen_mode,
          t_book_id: t_book_id,
          dpi: itemUrls.dpi,
          over: Boolean(over),
          video_id,
          playTime,
          sort,
          ...(!url && { url: itemUrls.url }),
        },
      }
    })
  },
  updateChapterSource: (chapterItem: Array<ChapterItem | BookPreLoadType>) => {
    set((state) => {
      const chapterItemMap = new Map(
        chapterItem.map((item) => [item.chapter_id, item])
      )
      return {
        chapterList: state.chapterList.map((chapter) => {
          const hitChapter = chapterItemMap.get(chapter.chapter_id)
          if (hitChapter) {
            const itemUrls = formatDefinition(
              hitChapter.play_info
            ) as Book.IPlayItem
            const useProps = findUsedChapterProps(hitChapter)
            return {
              ...chapter,
              ...useProps,
              ...(!chapter.url && { url: itemUrls.url }),
              dpi: itemUrls.dpi,
            }
          }
          return chapter
        }),
      }
    })
  },
}))
/**
 * 挑出用到的属性
 * @param chapterItem
 * @returns Partial<ChapterItem | BookPreLoadType>
 */
const findUsedChapterProps = (
  chapterItem: ChapterItem | BookPreLoadType
): ChapterItem | BookPreLoadType => {
  const props = {
    chapter_id: chapterItem.chapter_id,
    serial_number: chapterItem.serial_number,
    is_lock: chapterItem.is_lock,
    play_info: chapterItem.play_info,
    duration: chapterItem.duration,
    unlock_cost: chapterItem.unlock_cost ?? 0,
    video_type: chapterItem.video_type,
    video_id: chapterItem.video_id,
    vip_free: chapterItem.vip_free,
    t_book_id: chapterItem.t_book_id,
    video_pic: chapterItem.video_pic,
    sort: chapterItem.sort,
    dpi: chapterItem.dpi,
    vtt_lang: chapterItem.vtt_lang,
    screen_mode: chapterItem.screen_mode,
    playTime: chapterItem.playTime,
  }
  return Object.fromEntries(
    Object.entries(props).filter(([_, value]) => value !== undefined)
  ) as ChapterItem | BookPreLoadType
}

export const useDramaStore = createSelectors(useDrama)
