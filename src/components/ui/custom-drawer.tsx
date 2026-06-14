import React, { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface DrawerProps {
  /** 是否打开 */
  open: boolean
  /** 关闭回调 */
  onClose: () => void
  /** 子元素 */
  children: React.ReactNode
  /** 自定义类名 */
  className?: string
  /** 禁用动画（兼容低端机型） */
  disableAnimation?: boolean
  /** 动画时长（ms） */
  duration?: number
  /** 点击蒙层是否关闭 */
  closeOnOverlayClick?: boolean
  /** z-index 层级（嵌套时可增加） */
  zIndex?: number
  /** 是否展示关闭按钮 */
  showCloseButton?: boolean
}

const Drawer: React.FC<DrawerProps> = ({
  open,
  onClose,
  children,
  className,
  disableAnimation = false,
  duration = 600,
  closeOnOverlayClick = true,
  zIndex = 1000,
  showCloseButton = true,
}) => {
  // 控制是否渲染 DOM
  const [mounted, setMounted] = useState(false)
  // 控制动画进度 (0-1)
  const [progress, setProgress] = useState(0)
  const animationRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)

  // 弹性缓动函数（减弱弹性效果）
  const easeOutElastic = (t: number): number => {
    if (t === 0 || t === 1) return t
    const p = 0.8 // 增大周期，减少弹跳次数
    const a = 0.4 // 降低振幅
    return (
      a * Math.pow(2, -10 * t) * Math.sin(((t - p / 4) * (2 * Math.PI)) / p) + 1
    )
  }

  // 收起缓动函数（更快速）
  const easeOutQuad = (t: number): number => {
    return 1 - (1 - t) * (1 - t)
  }

  // 执行动画
  const animate = useCallback(
    (targetProgress: number) => {
      if (disableAnimation) {
        setProgress(targetProgress)
        if (targetProgress === 0) setMounted(false)
        return
      }

      const startProgress = progress
      startTimeRef.current = performance.now()
      // 关闭动画使用更短的时长
      const animDuration = targetProgress === 1 ? duration : duration * 0.6

      const tick = (now: number) => {
        const elapsed = now - startTimeRef.current
        const rawT = Math.min(elapsed / animDuration, 1)

        // 展开时使用弹性动画，收起时使用普通缓动
        const easedT =
          targetProgress === 1 ? easeOutElastic(rawT) : easeOutQuad(rawT)
        const currentProgress =
          startProgress + (targetProgress - startProgress) * easedT

        setProgress(currentProgress)

        if (rawT < 1) {
          animationRef.current = requestAnimationFrame(tick)
        } else {
          setProgress(targetProgress)
          if (targetProgress === 0) setMounted(false)
        }
      }

      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      animationRef.current = requestAnimationFrame(tick)
    },
    [disableAnimation, duration, progress]
  )

  useEffect(() => {
    if (open) {
      setMounted(true)
      // 下一帧开始动画
      requestAnimationFrame(() => {
        animate(1)
      })
    } else if (mounted) {
      animate(0)
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [open])

  // 禁止页面滚动并补偿滚动条
  useEffect(() => {
    if (mounted) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
      const originalOverflow = document.body.style.overflow
      const originalPaddingRight = document.body.style.paddingRight

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`
        document.documentElement.style.setProperty(
          '--removed-body-scroll-bar-size',
          `${scrollbarWidth}px`
        )
      }

      document.body.style.overflow = 'hidden'

      return () => {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
        document.documentElement.style.removeProperty(
          '--removed-body-scroll-bar-size'
        )
      }
    }
  }, [mounted])

  // 处理蒙层点击
  const handleOverlayClick = useCallback(() => {
    if (closeOnOverlayClick) {
      onClose()
    }
  }, [closeOnOverlayClick, onClose])

  // 阻止内容区域点击冒泡
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
  }, [])

  if (!mounted) return null

  // 根据进度计算样式
  const overlayOpacity = progress * 0.7
  const translateY = (1 - progress) * 100

  return (
    <>
      {createPortal(
        <div
          className='pointer-events-auto fixed inset-0'
          style={{
            backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            zIndex,
          }}
          onClick={handleOverlayClick}
        >
          <div
            className={cn(
              'absolute bottom-0 left-0 right-0 mx-auto max-w-xl overflow-hidden rounded-t-[16px] bg-[#141414]',
              className
            )}
            style={{
              transform: `translateY(${translateY}%)`,
              right: 'var(--removed-body-scroll-bar-size, 0px)',
            }}
            onClick={handleContentClick}
          >
            {/* 拖拽指示条 */}
            {/* <div className="flex justify-center pt-8px pb-4px">
          <div className="w-36px h-4px bg-white/20 rounded-full" />
        </div> */}
            {showCloseButton && (
              <div
                className='absolute right-4 top-4 h-6 w-6 bg-[url(https://v-mps.crazymaplestudios.com/images/37d62570-4d7c-11f0-860b-97fc2eb1c6d9.png)] bg-contain bg-no-repeat rtl:left-4 rtl:right-auto'
                onClick={onClose}
              ></div>
            )}
            {/* 内容区域 */}
            <div className={cn('max-h-[calc(80vh)] overflow-y-auto', (className?.includes('h-screen') || className?.includes('h-dvh') || className?.includes('h-[100dvh]')) && 'max-h-none h-[100dvh]')}>
              {children}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

export default Drawer
