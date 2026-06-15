import { useCallback, useRef } from 'react'
import { MoveVideoProps } from '@/types/drama'
/**
 * 单个视频池管理Hook
 * 通过 appendChild 移动 video 元素到不同容器，并切换 src
 *
 * @param chapterList 章节列表
 */
export const useVideoPool = () => {
  /** video组件引用 */
  const videoCompRef = useRef<HTMLDivElement>(null)

  /**
   * 移动 Video 到新容器并切换 src
   * @param newContainer 目标容器
   */
  const switchToVideo = useCallback(
    ({ newContainer }: MoveVideoProps) => {
      // 参数校验
      if (!newContainer || !videoCompRef.current) {
        return false
      }
      // 移动到新容器（如果需要）
      newContainer.appendChild(videoCompRef.current)
      return true
    },
    []
  )

  return {
    videoCompRef,
    switchToVideo,
  }
}
