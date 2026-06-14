import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import { useCallback,useRef } from 'react';

type UnifiedEvent = ReactMouseEvent<HTMLElement> | ReactTouchEvent<HTMLElement>;

interface UseDoubleClickOptions {
  /** 双击触发时的回调函数 */
  onDoubleClick: (event: UnifiedEvent) => void;
  /** 单击触发时的回调函数 */
  onClick?: (event: UnifiedEvent) => void;
  /** 双击的时间间隔阈值，单位毫秒，默认 200ms */
  latency?: number;
}

export const useDoubleClick = ({
  onDoubleClick,
  onClick,
  latency = 300,
}: UseDoubleClickOptions) => {
  /** 使用 useRef 存储点击次数和时间戳，避免重新渲染时丢失状态 */
  const clickCountRef = useRef(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  /** 统一的处理函数，支持鼠标和触摸事件 */
  const handleEvent = useCallback(
    (event: UnifiedEvent) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      clickCountRef.current += 1;
      if (clickCountRef.current === 1) {
        // 第一次点击
        timerRef.current = setTimeout(() => {
          if (clickCountRef.current === 1) {
            onClick?.(event);
          }
          clickCountRef.current = 0;
          timerRef.current = null;
        }, latency);
        
      } else if (clickCountRef.current === 2) {
        // 第二次点击（双击）
        // 清除延迟执行的回调
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        // 执行双击回调
        onDoubleClick(event);
        // 重置点击计数
        clickCountRef.current = 0;
      }
    },
    [onDoubleClick, onClick, latency]
  );

  /** 鼠标点击处理函数 */
  const handleClick = useCallback(
    (event: ReactMouseEvent<HTMLElement>) => {
      handleEvent(event);
    },
    [handleEvent]
  );

  /** 触摸开始处理函数 */
  const handleTouchEnd = useCallback(
    (event: ReactTouchEvent<HTMLElement>) => {
      handleEvent(event);
    },
    [handleEvent]
  );

  return {
    onClick: handleClick,
    onTouchEnd: handleTouchEnd,
  };
};

