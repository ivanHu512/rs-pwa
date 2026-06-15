'use client';
import React, { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect,useRef, useState } from 'react';

import { cn } from '@/lib/utils';
import { ExposeRef, SlideParams } from '@/types/drama';
interface VerticalSwiperProps {
  children: React.ReactNode[];
  screenH?: number | string;
  className?: string;
  /** 初始显示的页面索引 */
  initialSlide?: number;
  /** 是否允许上滑展示下一章 */
  enableSwipe?: boolean;
  /** 滑动距离系数 */
  baseThreshold?: number;
  /** 滑动速度阈值 */
  baseVelocity?: number;
  /** 动画时间 单位ms */
  duration?: number;
  /** 滑动切换触发 */
  onSlideChange?: (index: number, autoLock?: boolean) => void;
  /** 滑动距离的上报 */
  onJudgeClick?: (flag: boolean) => void;
  onTouchStart?: () => void;
}
/**
 * 垂直滑动组件
 * 支持触摸滑动、鼠标滚轮和指示器点击切换页面
 */
export const VerticalSwiper = forwardRef<ExposeRef, VerticalSwiperProps>(({
  children,
  className,
  initialSlide = 0,
  enableSwipe = false,
  baseThreshold = 0.4,
  baseVelocity = 0.2,
  duration = 300,
  screenH = "100vh",
  onSlideChange,
  onJudgeClick,
  onTouchStart
}, ref) => {
  /** 当前显示的页面索引 */
  const currentIndexRef = useRef<number>(initialSlide);
  /** 触摸开始时的Y坐标 */
  const touchStartYRef = useRef<number>(0);
  /** 是否正在执行过渡动画 */
  const [isTransitioning, setIsTransitioning] = useState(false);
  /** 是否正在拖拽 */
  const [isDragging, setIsDragging] = useState(false);
  /** 拖拽偏移量 */
  const [dragOffset, setDragOffset] = useState(0);
  /** 容器DOM引用 */
  const containerRef = useRef<HTMLDivElement>(null);
  /** 触摸开始时间，用于计算滑动速度 */
  const touchStartTime = useRef<number>(0);
  /** 实时滑动速度 */
  const velocity = useRef<number>(0);
  /** 判断上滑还是下滑 */
  const isDownSwiper = useRef<boolean>(true);
  const swiperDownRef = useRef<boolean>(true);
  /** 记录上次滚轮触发时间，用于节流 */
  const lastWheelTimeRef = useRef<number>(0);
  /** 滚轮节流时间 2秒 */
  const WHEEL_THROTTLE_TIME = 1000;
  /**
   * 计算当前应该显示的索引，确保索引在有效范围内
   * @param index 目标索引
   * @returns 有效的索引值
   */
  const getValidIndex = useCallback((index: number) => {
    return Math.max(0, Math.min(index, children.length - 1));
  }, [children.length]);
  /**
   * 处理滑动到指定索引
   * @param index 目标索引
   * @param animated 是否使用动画过渡
   */
  const goToSlide = useCallback(({ page, animated = true }: SlideParams) => {
    const validIndex = getValidIndex(page);
    if (validIndex === currentIndexRef.current) return;
    setIsTransitioning(animated);
    currentIndexRef.current = validIndex;
    onSlideChange?.(validIndex, animated);
  }, [getValidIndex, onSlideChange]);
  /**
   * 触摸开始事件
   * 记录触摸起始位置和时间，初始化拖拽状态
   */
  const handleTouchStart = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if(isDragging) return
    const touch = e.touches[0];
    touchStartYRef.current = touch.clientY;
    setIsDragging(true);
    setDragOffset(0);
    touchStartTime.current = Date.now();
    velocity.current = 0;
    onTouchStart?.();
  }, [isDragging]);
  /**
   * 触摸移动事件
   * 更新拖拽距离
   */
  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (!isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - touchStartYRef.current;
    if(enableSwipe) {
      setDragOffset(deltaY);
    } else {
      if(deltaY > 0) {
        isDownSwiper.current = true
        setDragOffset(deltaY);
      } else {
        isDownSwiper.current = false
      }
    }
  }, [enableSwipe, isDragging]);
  /**
   * 触摸结束事件
   * 根据滑动距离和速度决定是否切换页面，或回弹到原位置
   */
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (!enableSwipe && (!isDragging || !isDownSwiper.current)) return;
    setIsDragging(false);
    const touch = e.changedTouches[0];
    const deltaY = touch.clientY - touchStartYRef.current;
    const dy = Math.floor(touch.clientY) - Math.floor(touchStartYRef.current);
    onJudgeClick?.(Math.abs(dy) <= 1);
    const currentTime = Date.now();
    const timeDelta = currentTime - touchStartTime.current;
    /** 计算滑动速度 */
    velocity.current = deltaY / timeDelta;
    const containerHeight = containerRef.current?.clientHeight || 0;
    const thresholdPixels = containerHeight * baseThreshold;
    /** 根据滑动距离和速度决定是否切换页面 */
    const shouldSwipe = Math.abs(deltaY) > thresholdPixels || Math.abs(velocity.current) > baseVelocity;
    if (shouldSwipe) {
      if (deltaY > 0 && currentIndexRef.current > 0) {
        goToSlide({ page: currentIndexRef.current - 1 });
      } else if (deltaY < 0 && currentIndexRef.current < children.length - 1) {
        goToSlide({ page: currentIndexRef.current + 1 });
      } else {
        /** 到达边界，回弹到当前位置 */
        setIsTransitioning(true);
        setDragOffset(0);
      }
    } else {
      /** 滑动距离不够，回弹到当前位置 */
      setIsTransitioning(true);
      setDragOffset(0);
    }
  }, [enableSwipe, isDragging, baseThreshold, children.length, goToSlide]);
  /**
   * 处理鼠标滚轮事件
   * 支持鼠标滚轮切换页面
   */
const handleWheel = useCallback((e: WheelEvent) => {
  e.preventDefault();

  // 滚动距离太小的忽略
  if(Math.abs(e.deltaY) < 2) {
    return
  }

  const isUp = e.deltaY < 0;
  const isDown = e.deltaY > 0;
  
  // 如果已经在边界，且继续向边界方向滚动，直接返回
  if ((isDown && currentIndexRef.current >= children.length - 1) ||
      (isUp && currentIndexRef.current <= 0)) {
    return;
  }
  
  // 是否动画中
  if (isTransitioning) {
    return;
  }
  
  // 节流控制
  const now = Date.now();
  if (now - lastWheelTimeRef.current < WHEEL_THROTTLE_TIME) {
    return;
  }

  // 通过所有检查，可以执行切换
  lastWheelTimeRef.current = now;

  if (isDown) {
    // 向下滚动
    if (enableSwipe) {
      goToSlide({ page: currentIndexRef.current + 1 });
      isDownSwiper.current = false;
    }
  } else if (isUp) {
    // 向上滚动
    goToSlide({ page: currentIndexRef.current - 1 });
  }
}, [enableSwipe, isTransitioning, children.length, goToSlide]);

  /**
   * 原生触摸事件监听器, passive
   * 确保能够阻止默认滚动行为
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [handleTouchMove, handleWheel]);
  /** 
   * 触发移动动画之后，需要取消动画效果
   */
  const transitionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
    }
    if(isTransitioning) {
      transitionTimerRef.current = setTimeout(() => { 
        setIsTransitioning(false)
        transitionTimerRef.current = null;
      }, duration)
    }
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, [isTransitioning, duration])

  /**
   * 组件卸载时清理所有定时器
   */
  useEffect(() => {
    return () => {
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
        transitionTimerRef.current = null;
      }
    };
  }, []);
  /**
   * 计算变换样式
   * 结合当前页面位置和拖拽偏移量计算最终的transform值
   */
  const getTransform = useCallback(() => {
    const baseTransform = -currentIndexRef.current * 100;
    const dragTransform = isDragging ? (dragOffset / (containerRef.current?.clientHeight || 1)) * 100 : 0;
    return `translateY(${baseTransform + dragTransform}%)`;
  }, [isDragging, dragOffset]);
  /** 主动调用 */
  useImperativeHandle(ref, () => ({
    goToSlide
  }))
  return (
    <div
      ref={containerRef}
      className={cn(
        'fixed left-0 top-0 w-full overflow-hidden h-[100vh] h-[100dvh]',
        className
      )}
      style={{ height: screenH}}
    >
      <div
        className={cn(
          'flex flex-col w-full h-full mx-auto w-full max-w-xl',
          isTransitioning && !isDragging && 'transition-transform ease-out'
        )}
        style={{
          transitionDuration: isTransitioning && !isDragging ? `${duration}ms` : '0ms',
          transform: getTransform(),
          backfaceVisibility: 'hidden',
          perspective: '1000px',  
          willChange: 'transform',
          isolation: 'isolate'
        }}
      >
        {children}
      </div>
    </div>
  );
});

VerticalSwiper.displayName = 'VerticalSwiper';
export default VerticalSwiper;

