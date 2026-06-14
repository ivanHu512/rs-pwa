/**
 * 播控条状态
 */
export enum ControlStatusEnum {
  /**隐藏 */
  HIDDEN = 1,
  /**显示并3s隐藏 */
  SHOW = 2,
  /**一直显示 */
  SHOW_ALL = 3,
}

/**
 * 视频播放按钮类型
 */
export enum VideoPlayBtnTypeEnum {
  /**loading */
  LOADING = 1,
  /**playing */
  PLAY = 2,
  /**pause */
  PAUSE = 3,
}

export interface UserInfo {
  bonus?: number
  coins?: number
  dev_model?: 'h5'
  /** 是否付费过0否1是 */
  is_pay?: number
  /** web白名单 */
  pc_white?: number
  pic?: string
  /** 登录类型0游客1苹果2FB3谷歌 */
  sid?: LoginType
  uid?: number
  uname?: string
  account?: AccountInfo
  subscribe_entrance?: SubscribeEntrance
}

/** 登录类型 */
export enum LoginType {
  VISITOR = 0,
  APPLE = 1,
  FB = 2,
  GG = 3,
  TT = 5,
}

export type SubscribeEntrance = {
  title: string
  subtitle: string
  expired: string
}

/** 账户信息 */
export type AccountInfo = {
  coins: number
  bonus: number
  pay_amount?: number
  vip_status?: number
  vip_type?: VipRewardTypeEnum
  /** vip_sec 是vip权益剩余秒数 */
  vip_sec?: number
  vip_expire?: number
  /** 1 - 普通会员 2-广告会员 */
  vip_category?: number
}

/** 会员类型 */
export enum VipRewardTypeEnum {
  /** 未订阅 */
  NON = 0,
  /** 周卡 */
  WEEK = 1,
  /** 年卡 */
  YEAR = 2,
  /** 月卡 */
  MONTH = 3,
  /** 广告周卡 */
  WEEK_ADS = 11,
  /** 广告月卡 */
  MONTH_ADS = 12,
  /** 广告年卡 */
  YEAR_ADS = 13,
}

/** 视频列表类型定义 */
export type VideoItem = {
  id: string // 视频唯一标识
  url: string // 视频URL地址
  title?: string
}

/** 视频池子video实例 */
export type VideoPoolItem = {
  /** 引用Video组件中的video元素 */
  videoRef: React.RefObject<HTMLVideoElement> | null
  /** 当前分配的视频ID */
  assignedId: string | number | null
  chapterId: string | number | null
}

/** 每个章节播放进度 */
export type VideoPlayProgress = {
  /** 当前播放时间（秒） */
  currentTime: number
}

export interface SlideParams {
  page: number
  animated?: boolean
}
export interface ExposeRef {
  goToSlide: (data: SlideParams) => void
  screenH?: number | string
}

export interface PageRef {
  // setShowCover: (status: boolean) => void;
  setLockedModalVisible: (status: boolean) => void
}

export interface VideoRef {
  progressMapRef: BookVideoProgressMap
}

/**登录参数 */
export interface LoginParams {
  uname: string //	用户名
  sid: number //	登录类型0游客1苹果2FB3谷歌
  openid?: string //	平台ID，登录相关
  dev_model?: string //	设备型号
  pic: string //	头像地址
  email?: string //用户邮箱
  pay_mode?: string //控制订阅ab测
  media_type?: string //投放渠道
  composition_id?: string // 投放链接上的作品id
  campaign_id?: string // 投放链接携带的campaign_id
  ad_group_id?: string // 投放链接携带的上的ad_group_id adset_id
  ad_id?: string // 投放链接携带的ad_id
}

/**
 * 短剧初始化数据类型
 */
export interface MoveVideoProps {
  newContainer: HTMLElement | null
  chapterId: string
  url: string
  pic?: string
}

export type VideoPlayerVariant = 'ali' | 'native'

export interface DramaProps {
  bookInfo?: RawBookDetailResponse | null
  preload?: Array<BookPreLoadType | ChapterItem>
  sort?: number
  readRecord?: ReadRecordType
  switchToVideo?: (data: MoveVideoProps) => void
}

/**
 * 获取章节详情参数
 */
export interface ChapterDetailRequestParams {
  bookId: string
  chapterId: number
}

/** 书籍详情 */
export type RawBookDetailResponse = {
  account?: AccountInfo
  /** 书籍ID */
  book_id: string
  /** 书名 */
  book_title: string
  /** 封面 */
  book_pic: string
  /** 推荐语 */
  special_desc: string
  /** 章节总数 */
  chapter_count: number
  /** 付费状态 */
  is_paid?: PayStatus
  /** 付费起始章节 */
  paid_start?: number
  /** 预加载视频信息 */
  preLoad?: BookPreLoadType
  /** 预告片 */
  previewChapter?: BookPreLoadType
  /** 第一章 */
  firstChapter?: BookPreLoadType
  /** 1=竖屏 0=横屏 */
  screen_mode?: 1 | 0
  s_book_id?: number
  /** 播放记录 */
  readRecord?: ReadRecordType
  /** 其余 */
  [key: string]: any
}

export type ReadRecordType = {
  chapterId?: string
  sec?: number
  serialNumber?: number
  is_lock?: ChapterLockStatus
  play_info?: string
  vtt_lang?: Array<string>
  video_pic?: string
  video_id?: string
}

/** 章节列表 */
export type RawChapterListResponse = {
  account?: AccountInfo
  chapter_lists: Array<ChapterItem>
}

/** 章节内容 */
export type RawChapterContentResponse = ChapterItem & {
  account?: AccountInfo
}

/** 章节信息 */
export type ChapterItem = {
  /** 播放信息 */
  play_info: string
  /** 章节ID */
  chapter_id: string
  /** 视频ID */
  video_id?: string
  t_book_id: string
  /** 章节封面图片 */
  video_pic: string
  /** 章节名称 */
  chapter_name: string
  /** 章节解锁状态 */
  is_lock: ChapterLockStatus
  /** 视频总时长 */
  duration: number
  /** 章节解锁所需金币 */
  unlock_cost: number
  /** 章节解锁所需金币 */
  cost_coins: number
  /** m3u8资源 */
  url?: string
  /** 预加载 */
  preLoad?: Array<BookPreLoadType>
  /** 章节类型 */
  video_type?: VideoType
  /** 章节序号 */
  serial_number?: number
  vip_free?: number
  sort?: number
  dpi?: number
  account?: AccountInfo
  status?: storyStatus
  over?: boolean
  vtt_lang?: Array<string>
  /** 1=竖屏 0=横屏 */
  screen_mode?: 1 | 0
  playTime?: number
  /** 其余 */
  [key: string]: any
}

/** 章节类型 */
export enum VideoType {
  normal = 1,
  trailer = 2,
}

/** 书籍列表返回的preload */
export type BookPreLoadType = {
  /** 播放信息 */
  play_info: string
  /** 章节ID */
  chapter_id: string
  /** 视频ID */
  video_id?: string
  /** 章节封面图片 */
  video_pic: string
  /** m3u8资源 */
  url?: string
  /** 章节类型 */
  video_type?: VideoType
  /** 章节序号 */
  serial_number?: number
  /** 是否解锁 */
  is_lock?: ChapterLockStatus
  /** 章节解锁所需金币 */
  unlock_cost: number
  vip_free?: number
  sort?: number
  t_book_id?: string
  /** 视频总时长 */
  duration: number
  dpi?: number
  account?: AccountInfo
  status?: storyStatus
  over?: boolean
  vtt_lang?: Array<string>
  /** 1=竖屏 0=横屏 */
  screen_mode?: 1 | 0
  playTime?: number
}

/** 作品或章节状态 */
export enum storyStatus {
  /** 正常 */
  NORMAL = 1,
  /** 作品下架 */
  BOOK_UNPUBLISH = 2,
  /** 章节下架 */
  CHAPTER_UNPUBLISH = 3,
}

/** 书籍是否付费 */
export enum PayStatus {
  /** 免费 */
  FREE = 0,
  /** 付费 */
  PAID = 1,
}

/** title信息 */
export type ChapterTitleItem = {
  /** title信息 */
  title: string
  /** 起始章节ID */
  startId: number
  /** 结束章节ID */
  endId: number
}

/** 章节解锁状态 */
export enum ChapterLockStatus {
  /** 免费 */
  FREE = 0,
  /** 未解锁 */
  LOCKED = 1,
  /** 已解锁 */
  UNLOCK = 2,
}

/** 章节具体信息, 带有完整内容 */
export type ChapterDetailBaseItem = Partial<Omit<ChapterItem, 'chapter_pic'>>

/** 章节返回的信息 */
export type ChapterDetailResponse = ChapterDetailBaseItem & {
  content_pic?: Array<string>
  account?: AccountInfo
  preLoad?: Array<ChapterDetailResponse>
}

/** H5格式化章节信息 */
export type ChapterH5DetailItem = ChapterDetailBaseItem & {
  content_pic: Array<any>
}

/**
 * 图片加载状态
 */
export enum ImageLoadStatus {
  /**
   * 未加载
   */
  NON = 0,
  /**
   * 加载成功
   */
  SUCCESS = 1,
  /**
   * 加载失败
   */
  FAIL = 2,
}

export type BookVideoProgressMap = Record<
  string,
  Record<string, VideoPlayProgress>
>

export enum VideoAllowed {
  ALLOW = 'NotAllowedError',
  // ABORT = "AbortError"
}
