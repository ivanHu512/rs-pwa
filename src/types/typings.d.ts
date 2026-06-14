declare module 'js-encrypt'

declare namespace Book {
  /**
   * 嵌入播放页接口数据
   */
  export interface IEmbedVideoData {
    book_id: string
    chapter_id: string
    play_info: string
    video_pic: string
    chapter_name: string
    book_title: string
    serial_number: number
    next_chapter_id: string
  }
  export enum LockStatus {
    FREE = 0,
    UNLOCK = 2,
    LOCK = 1,
  }

  export type NewTag = {
    id: string
    text: string
    category_id: string
  }[]

  export type TDefinition = 360 | 540 | 720 | 1080
  export type TDefinitionStr = '360P' | '540P' | '720P' | '1080P'

  export interface IPlayInfo {
    PlayURL: string
    Encode: 'H264' | 'H265'
    Dpi: TDefinition
  }

  export interface IPlayItem {
    url: string
    definition: Book.TDefinitionStr
    dpi: TDefinition
  }
}

interface HlsEventsMap {
  ERROR: string
}

interface HlsErrorTypesMap {
  NETWORK_ERROR: string
  MEDIA_ERROR: string
}

interface HlsErrorData {
  fatal: boolean
  type: string
}

interface HlsInstance {
  destroy(): void
  loadSource(source: string): void
  attachMedia(video: HTMLVideoElement): void
  startLoad(): void
  recoverMediaError(): void
  on(event: string, handler: (event: string, data: HlsErrorData) => void): void
}

interface HlsConstructor {
  new (config?: Record<string, unknown>): HlsInstance
  isSupported(): boolean
  Events: HlsEventsMap
  ErrorTypes: HlsErrorTypesMap
}

declare global {
  interface Window {
    Hls?: HlsConstructor
    Aliplayer?: unknown
    rsVideoPlayer?: 'ali' | 'native'
  }
}

interface NavigatorWithConnection extends Navigator {
  connection?: {
    downlink: number
    effectiveType: string
    rtt: number
    saveData: boolean
  }
}
