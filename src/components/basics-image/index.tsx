'use client'

import type { ImgHTMLAttributes } from 'react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'

/**
 * @component 图片组件， 默认处理加载失败隐藏当前元素, 允许重试(重试追加随机参)
 * @param props IBasicsImageProps
 * @returns
 */

type ImageLoader = (params: {
  src: string
  width: number
  quality?: number
}) => string

interface IBasicsImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  /** 是否重试 */
  isRetry?: boolean
  /** 重试次数 */
  retryTime?: number
  /** 重试间隔 毫秒 */
  retryInterval?: number
  /** 固定src类型 */
  src: string
  loader?: ImageLoader
  quality?: number
}

const BasicsImage = (basicsImageProps: IBasicsImageProps) => {
  const {
    isRetry = false,
    retryTime = 3,
    retryInterval = 500,
    src,
    loader,
    width,
    quality,
    ...props
  } = basicsImageProps

  const timeRef = useRef<any>(null)
  const currentTimesRef = useRef<number>(retryTime)
  const [imgSrc, setImgSrc] = useState<string>(src)

  const finalSrc = useMemo(() => {
    if (!loader) return imgSrc

    return loader({
      src: imgSrc,
      width: Number(width) || 0,
      quality,
    })
  }, [imgSrc, loader, quality, width])

  const resetSrc = () => {
    currentTimesRef.current = currentTimesRef.current - 1
    const url = new URL(imgSrc, window.location.origin)
    const params = new URLSearchParams(url.search)
    if (!params.has('retryTime')) {
      params.append('retryTime', currentTimesRef.current.toString())
    } else {
      params.set('retryTime', currentTimesRef.current.toString())
    }
    url.search = params.toString()
    const modifiedUrl = url.toString()
    if (timeRef.current) clearTimeout(timeRef.current)
    timeRef.current = setTimeout(() => {
      setImgSrc(modifiedUrl)
    }, retryInterval)
  }

  useEffect(() => {
    return () => {
      if (timeRef.current) clearTimeout(timeRef.current)
    }
  }, [])

  /**
   * 资源更新
   *  清除定时，重置重试次数
   */
  useEffect(() => {
    currentTimesRef.current = retryTime
    if (timeRef.current) clearTimeout(timeRef.current)
    setImgSrc(src)
  }, [retryTime, src])

  return (
    <img
      onError={(e) => {
        try {
          if (isRetry && currentTimesRef.current > 0) resetSrc()
          else e.currentTarget.style.visibility = 'hidden'
        } catch {
          e.currentTarget.style.visibility = 'hidden'
        }
      }}
      // alt="image"
      {...props}
      width={width}
      src={finalSrc}
    />
  )
}

BasicsImage.displayName = 'BasicsImage'
export default memo(BasicsImage)
