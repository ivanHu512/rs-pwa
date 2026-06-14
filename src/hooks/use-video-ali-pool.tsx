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
  /** 当前激活的视频ID */
  const activeIdRef = useRef<string | null>(null)

  /**
   * 移动 Video 到新容器并切换 src
   * @param newContainer 目标容器
   * @param chapterId 视频ID（章节ID）
   * @param url 视频资源地址
   * @param pic 视频封面
   */
  const switchToVideo = useCallback(
    ({ newContainer, chapterId }: MoveVideoProps) => {
      // 参数校验
      if (!newContainer || !videoCompRef.current) {
        return false
      }

      // 如果已经在目标容器且是同一个章节，直接返回
      if (activeIdRef.current === chapterId) {
        return true
      }

      // 移动到新容器（如果需要）
      newContainer.appendChild(videoCompRef.current)

      // 更新当前激活的视频ID
      activeIdRef.current = chapterId
      return true
    },
    []
  )

  return {
    videoCompRef,
    switchToVideo,
  }
}
