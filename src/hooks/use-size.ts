import { useLayoutEffect, useState } from 'react'

interface WindowSize {
  /**窗口宽度 */
  width: number | string
  /**窗口高度 */
  height: number | string
}
/**
 * 用于获取浏览器窗口可见区域的实时尺寸
 * @returns {WindowSize} 包含 width 和 height 的对象
 */
export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: '100vw',
    height: '100dvh',
  })
  /**
   * 在 DOM 更新后同步执行副作用
   */
  useLayoutEffect(() => {
    /**
     * 处理窗口大小变化的回调函数
     * 更新 windowSize 状态为当前窗口的实际尺寸
     */
    const handleResize = () => {
      console.log(
        '屏幕尺寸',
        window.innerWidth,
        window.innerHeight,
        window.orientation
      )
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    /**
     * 监听横竖屏切换
     * 延迟 100ms 获取实际尺寸
     */
    let orientationTimer: NodeJS.Timeout | null = null
    const handleOrientationChange = () => {
      clearTimeout(orientationTimer!)
      orientationTimer = setTimeout(handleResize, 100)
    }

    /**立即调用一次，获取初始窗口尺寸 */
    handleResize()

    const delayTimings = [300, 800, 1300, 2500]
    const timers: Array<NodeJS.Timeout> = []
    /**延迟调用3次，获取safari浏览器窗口变动尺寸, 有些设备窗口变动较慢 */
    delayTimings.forEach((delay) => {
      const timerId = setTimeout(() => {
        handleResize()
      }, delay)
      timers.push(timerId)
    })

    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      timers.forEach((timerId) => clearTimeout(timerId))
    }
  }, [])

  return windowSize
}
