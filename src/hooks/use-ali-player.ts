'use client'

// import 'aliyun-aliplayer'
import 'aliyun-aliplayer/build/skins/default/aliplayer-min.css'

import { useCallback, useRef, useState } from 'react'
import { getSiteConfigClient } from '@/lib/config/site'
import { aliOssLoader } from '@/lib/aliOssLoader'

export interface FontConfig {
  [lang: string]: {
    family: string
    isDefaultFont?: boolean
  }
}

const FONT_CONFIG: FontConfig = {
  ja: { family: 'Noto_Sans_Japan' },
  ko: { family: 'Noto_Sans_Korean' },
  th: { family: 'Noto_Sans_Thai_Looped' },
  ar: { family: 'Noto_Naskh_Arabic' },
  hi: { family: 'Noto_Sans_Devanagari' },
  zh: { family: 'Noto_Sans_HongKong' },
  'zh-TW': { family: 'Noto_Sans_HongKong' },
}

const DEFAULT_FONT_FAMILY = 'Noto_Sans'

const LICENSE_KEY = 'Io8XbgjL9aD2LuJyt0f00b5c3148a436cb3306baaf29e1b98'
const LICENSE_DOMAIN =
  getSiteConfigClient()?.aliPlayer?.licenseDomain || 'reelshort.com'

const baseConfig: any = {
  id: 'video_player',
  license: {
    domain: LICENSE_DOMAIN, // 申请 License 时填写的域名
    key: LICENSE_KEY, // 申请成功后，在控制台可以看到 License Key
  },
  width: '100%',
  // autoSize: true,
  // height: '100vh',
  format: 'hls',
  isLive: false,
  rePlay: false,
  isVBR: true,
  // preload: false,
  playsinline: true,
  useH5Prism: true,
  skinLayout: [],
  // mute: true,
  lazySubtitleLoad: true,
  longPressFastForward: false,
  dbClickSkip: false,
  useHlsPluginForSafari: true,
  subtitleRenderMode: 2,
  enableABR: false,
  startQuality: { index: 0 },
  clickPause: false,
  dbClickFullscreen: false,
  disableSubtitlePausedUpdate: true,
  hlsOption: {
    progressive: true,
  },
  autoplayPolicy: {
    fallbackToMute: true,
    // showUnmuteBtn: false
  },
  subtitleStyleConfig: {
    containerMargin: '0px',
    textStyle: {
      display: 'block',
      lineHeight: 'normal',
    },
  },
}

const getRegionBottomByViewportAnchor = (region: any) => {
  const top = Number(region?.viewportAnchorY)
  if (top === 0) return null
  if (!Number.isFinite(top)) return null
  return `${Math.max(100 - top, 0)}%`
}

interface InitHandleParams {
  url: string
  options?: Record<string, unknown> & { cover?: string }
  appendParams?: {
    book_id?: string
    vtt_lang?: Array<string>
    lang?: string
    isMobile?: boolean
    /** 1=竖屏 0=横屏 */
    screen_mode?: 1 | 0
    /** 1=自制剧 2=出海剧 */
    book_source?: number // 1 | 2
  }
}

interface ChangeVideoHandleParams {
  url: string
  options?: {
    cover?: string
    startTime?: number
    defaultSubtitleLang?: string
    autoplay?: boolean
    mute?: boolean
  }
}

/** 播放器事件回调类型 */
type PlayerEventCallback = (e: any) => void

/** 事件映射配置 */
interface PlayerEventConfig {
  ready?: PlayerEventCallback
  play?: PlayerEventCallback
  canplay?: PlayerEventCallback
  playing?: PlayerEventCallback
  pause?: PlayerEventCallback
  autoplay?: PlayerEventCallback
  waiting?: PlayerEventCallback
  timeupdate?: PlayerEventCallback
  error?: PlayerEventCallback
  ended?: PlayerEventCallback
  mutedAutoplay?: PlayerEventCallback
  playFailed?: PlayerEventCallback
  onAliWaiting?: PlayerEventCallback
  onAliCanPlay?: PlayerEventCallback
  onAliPlaying?: PlayerEventCallback
}

interface IVideoHookProps {
  onPlayerCreateFinish?: (e: any) => void
  onCanPlay?: (e: any) => void
  onPlaying?: (e: any) => void
  onWaiting?: (e: any) => void
  onPause?: (e: any) => void
  onAutoplayWasPrevented?: (e: any) => void
  onMutedAutoplayWasPrevented?: (e: any) => void
  onTimeUpdate?: (e: any) => void
  onEnded?: (e: any) => void
  onError?: (e: any) => void
  onLoadedMetadata?: (e: any) => void
  onPlay?: (e: any) => void
  onAliWaiting?: (e: any) => void
  onAliCanPlay?: (e: any) => void
  onAliPlaying?: (e: any) => void
}

/**
 * 字幕样式
 * 1. 字幕最大宽度90%  -- VTT实现
 * 2. 竖屏字幕距离底部21% ， 横屏距离底部高度？ -- web实现
 * 3. 背景框圆角3px、左右内间距3: pxpadding: 0 3px 3px 3px,  border-radius: 3px; 背景background: rgba(0, 0, 0, 0.30) --  出海剧 VTT实现
 * 4. 外层阴影text-shadow: 0 0 1px rgba(0, 0, 0, 0.80), 0 1px 3px rgba(0, 0, 0, 0.40)   -- 自制剧 web实现
 * 5. 字幕行间距调整  --  web实现
 * 6. 字幕末行与底部对齐，即排列底部对齐  --  播放器已实现
 */
export default ({
  onPlayerCreateFinish = (e: any) => {},
  onCanPlay = (e: any) => {},
  onPlaying = (e: any) => {},
  onWaiting = (e: any) => {},
  onPause = (e: any) => {},
  onLoadedMetadata = (e: any) => {},
  onAutoplayWasPrevented = (e: any) => {},
  onMutedAutoplayWasPrevented = (e: any) => {},
  onTimeUpdate = (e: any) => {},
  onEnded = (e: any) => {},
  onError = (e: any) => {},
  onPlay = (e: any) => {},
  onAliWaiting = (e: any) => {},
  onAliCanPlay = (e: any) => {},
  onAliPlaying = (e: any) => {},
}: IVideoHookProps) => {
  /** 播放器实例 */
  const playerSdk = useRef<any>(null)
  /** 播放器初始化标识 */
  const [videoInit, setVideoInit] = useState(false)

  /** 销毁播放器 */
  const destroyAliPlayer = useCallback(() => {
    if (playerSdk.current) {
      playerSdk.current.dispose()
    }
  }, [])

  /** 手动设置封面, 解决ali配置封面方式不生效的问题 */
  const handleVideoPoster = useCallback((cover?: string) => {
    const videoElement = document.querySelector(`#${baseConfig.id} video`)
    if (videoElement && cover) {
      const croppedCover = aliOssLoader({ src: cover, width: 640 })
      videoElement.setAttribute('poster', croppedCover)
    }
  }, [])

  /** 注册播放器事件监听器 */
  const registerAliPlayerEvents = useCallback(
    (player: any, events: PlayerEventConfig) => {
      const eventMap: Array<[string, PlayerEventCallback | undefined]> = [
        ['ready', events.ready],
        ['play', events.play],
        ['canplay', events.canplay],
        ['playing', events.playing],
        ['pause', events.pause],
        ['autoplay', events.autoplay],
        ['waiting', events.waiting],
        ['timeupdate', events.timeupdate],
        ['error', events.error],
        ['ended', events.ended],
        ['mutedAutoplay', events.mutedAutoplay],
        ['playFailed', events.playFailed],
      ]

      eventMap.forEach(([eventName, callback]) => {
        if (callback) {
          player.on(eventName, callback)
        }
      })
    },
    []
  )

  /** 获取字幕字体 */
  const getVttFontFamily = (lang: string): string => {
    if (!lang || !FONT_CONFIG[lang]) return DEFAULT_FONT_FAMILY
    return FONT_CONFIG[lang].family
  }

  /** 字幕编辑器配置 */
  const buildSubtitleEditorConfig = useCallback(
    (appendParams: NonNullable<InitHandleParams['appendParams']>) => {
      const { isMobile, screen_mode, lang = 'en' } = appendParams
      return (styleBox: any, context: any) => {
        if (context.type === 'style') {
          const styles: any = [...(context.styles || [])]

          const prismCueIndex = styles.findIndex((i: any) =>
            Object.prototype.propertyIsEnumerable.call(i, 'prism-cue-inner')
          )

          /** 横屏剧手机播放，需要放大字体 - 1.4 */
          if (isMobile && screen_mode === 0) {
            const defaultFontSize =
              styles[prismCueIndex]?.['prism-cue-inner']?.['font-size']

            if (defaultFontSize && prismCueIndex > -1) {
              const fontSizeMatch =
                String(defaultFontSize).match(/(\d+(?:\.\d+)?)/)
              if (fontSizeMatch) {
                const fontSizeValue = parseFloat(fontSizeMatch[1])
                const newFontSize = fontSizeValue * 1.4
                const unit =
                  String(defaultFontSize).replace(/[\d.]/g, '') || '%'
                styles[prismCueIndex]['prism-cue-inner']['font-size'] =
                  `${newFontSize}${unit}`
              }
            }
          }

          const defaultFontShadow =
            styles[prismCueIndex]?.['prism-cue-inner']?.['text-shadow']
          /** 修改阴影 */
          if (defaultFontShadow && prismCueIndex > -1) {
            styles[prismCueIndex]['prism-cue-inner']['text-shadow'] =
              '0 0 1px rgba(0, 0, 0, 0.80), 0 1px 3px rgba(0, 0, 0, 0.40)'
          }

          styles[prismCueIndex]['prism-cue-inner']['font-family'] =
            getVttFontFamily(lang)

          return styles
        }

        /** RS: region */
        if (context.type === 'region') {
          const regionId = context.regionData.id
          if (regionId === 'bottom') {
            const regionBottom =
              getRegionBottomByViewportAnchor(context.regionData?.region) ||
              (screen_mode === 1 ? '24%' : '5%')
            return {
              bottom: regionBottom,
              height: 'auto',
            }
          }
        }

        if (context.type === 'cue') {
          if (context.cue.region_id === 'bottom') {
            return {
              wrapperStyle: {
                bottom: '0px',
              },
            }
          }
        }
      }
    },
    []
  )

  /** 初始化播放器 */
  const initHandle = useCallback(
    ({ url, options = {}, appendParams = {} }: InitHandleParams) => {
      destroyAliPlayer()

      const customConfig = {
        source: url,
        ...baseConfig,
        ...options,
        subtitleEditor: buildSubtitleEditorConfig(appendParams),
      }

      try {
        // @ts-expect-error - Aliplayer is not defined
        playerSdk.current = new Aliplayer(customConfig, (e: any) => {
          console.log('video==>afterInit')
          window.$video = e
          onPlayerCreateFinish?.(e)
          setVideoInit(true)
          handleVideoPoster(options.cover)
        })

        /** 注册播放器事件 */
        registerAliPlayerEvents(playerSdk.current, {
          ready: onLoadedMetadata,
          play: onPlay,
          canplay: onCanPlay,
          playing: onPlaying,
          pause: onPause,
          waiting: onWaiting,
          timeupdate: onTimeUpdate,
          error: onError,
          ended: onEnded,
          autoplay: onAutoplayWasPrevented,
          mutedAutoplay: onMutedAutoplayWasPrevented,
          playFailed: (data: any) => {
            console.error('handle==>video==>播放失败:', data)
          },
        })
      } catch (error) {
        console.log(error)
      }
    },
    [
      onPlayerCreateFinish,
      onLoadedMetadata,
      onPlay,
      onCanPlay,
      onPlaying,
      onPause,
      onAutoplayWasPrevented,
      onWaiting,
      onTimeUpdate,
      onError,
      onEnded,
      onMutedAutoplayWasPrevented,
      buildSubtitleEditorConfig,
      registerAliPlayerEvents,
      destroyAliPlayer,
      handleVideoPoster,
    ]
  )

  /** 重置播放器视频资源 */
  const changeVideoHandle = useCallback(
    ({
      url,
      options: {
        cover,
        startTime,
        defaultSubtitleLang,
        autoplay = false,
        mute = false,
      } = {},
    }: ChangeVideoHandleParams) => {
      if (playerSdk.current) {
        handleVideoPoster(cover)
        playerSdk.current.setWatchTime?.(startTime)
        playerSdk.current.loadByUrlWithConfig(url, {
          cover,
          defaultSubtitleLang,
          autoplay,
          // preload: true,
          // mute,
        })
      }
    },
    [handleVideoPoster]
  )

  return {
    videoRef: playerSdk,
    videoInit,
    initHandle,
    changeVideoHandle,
    handleVideoPoster,
    destroyAliPlayer,
  }
}
