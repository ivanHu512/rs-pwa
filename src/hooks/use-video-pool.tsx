import { useCallback, useEffect, useRef } from 'react'

import { MoveVideoProps } from '@/types/drama'
/**
 * 单个视频池管理Hook
 * 通过 appendChild 移动 video 元素到不同容器，并切换 src
 *
 * @param chapterList 章节列表
 */
export const useVideoNativePool = () => {
  /** video组件引用 */
  const videoCompRef = useRef<HTMLDivElement>(null)
  /** 单个video元素引用 */
  const videoRef = useRef<HTMLVideoElement>(null)
  /** 当前激活的视频ID */
  const activeIdRef = useRef<string | null>(null)
  /** 视频静音状态 */
  const mutedRef = useRef<boolean>(true)
  /**
   * 移动 Video 到新容器并切换 src
   * @param newContainer 目标容器
   * @param chapterId 视频ID（章节ID）
   * @param url 视频资源地址
   * @param pic 视频封面
   */
  const switchToVideo = useCallback(
    ({ newContainer, chapterId, url, pic = '' }: MoveVideoProps) => {
      // 参数校验
      if (!videoRef.current || !newContainer || !videoCompRef.current) {
        return false
      }

      const el = videoRef.current
      const currentParent = el.parentNode

      // 如果已经在目标容器且是同一个章节，直接返回
      if (currentParent === newContainer && activeIdRef.current === chapterId) {
        return true
      }

      /** 更新视频状态 */
      try {
        // 保存并暂停上一个视频
        if (activeIdRef.current && el) {
          mutedRef.current = el.muted
          el.pause()
        }

        // 移动到新容器（如果需要）
        if (currentParent !== newContainer) {
          newContainer.appendChild(videoCompRef.current)
        }

        if (pic) {
          el.poster = pic
        }
        // 更新视频源（如果需要）
        if (el.src !== url && url) {
          // el.src = url;
        }
        // 恢复静音状态
        el.muted = mutedRef.current

        // 更新当前激活的视频ID
        activeIdRef.current = chapterId
        return true
      } catch (error) {
        console.error('移动 Video 失败:', error)
        return false
      }
    },
    []
  )
  return {
    videoRef,
    videoCompRef,
    switchToVideo,
  }
}
