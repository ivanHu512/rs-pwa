import supportsWebp from './supports-webp'

export interface LoaderParams {
  src: string
  width: number
  quality?: number
  disableWebP?: boolean
}

// 提前检测并缓存 WebP 支持结果,默认true (在客户端假设支持，后续检测更新)
let isSupportsWebPCached: boolean = typeof window !== 'undefined'

// 同步的 WebP 支持检测函数
const getWebPSupport = (): boolean => {
  return isSupportsWebPCached
}

// 初始化函数，在应用启动时调用
export const initWebPSupport = async (): Promise<void> => {
  isSupportsWebPCached = (await supportsWebp) as boolean
}

;(async () => {
  await initWebPSupport()
})()
/**
 * 同步的阿里云 OSS 图片加载器
 */
export const aliOssLoader = ({
  src,
  width,
  quality,
  disableWebP,
}: LoaderParams): string => {
  if (!src) return ''
  const url = new URL(src)
  if (url.hostname !== 'v-mps.crazymaplestudios.com') {
    return src
  }

  url.hostname = 'v-img.crazymaplestudios.com'
  // const isSupportsWebP = !disableWebP && getWebPSupport()
  const isSupportsWebP = false // 会导致水合问题，后续推动sre修改webp配置
  url.searchParams.set(
    'x-oss-process',
    `image/resize,w_${width}/quality,q_${quality || 80}${isSupportsWebP ? '/format,webp' : ''}`
  )

  return url.href
}
