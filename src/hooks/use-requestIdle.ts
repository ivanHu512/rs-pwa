import { useCallback, useEffect, useMemo, useRef } from "react";
const timeout = 1500;
interface IdleCallbackHandle {
  /** 是否超时处理 */
  didTimeout: boolean;
  /** 获取剩余空闲时间的函数 */
  timeRemaining: () => number;
}

interface UseRequestIdleReturn {
  /** 请求空闲回调的函数 */
  request: (
    callback: (handle: IdleCallbackHandle) => void,
    options?: IdleRequestOptions,
  ) => number;
  /** 取消空闲回调的函数 */
  cancel: () => void;
  /** 是否支持API */
  isSupported: boolean;
}

/**
 * requestIdleCallback 的 React 封装
 * @param 无
 * @returns {UseRequestIdleReturn}
 */
export function useRequestIdle(): UseRequestIdleReturn {
  const idleCallbackId = useRef<number | null>(null);
  const isSupported = useMemo(
    () => typeof window !== "undefined" && "requestIdleCallback" in window,
    [],
  );
  /**
   * 看情况是否取消当前的空闲回调
   */
  const cancel = useCallback(() => {
    if (idleCallbackId.current !== null) {
      if (isSupported) {
        window.cancelIdleCallback(idleCallbackId.current);
      } else {
        clearTimeout(idleCallbackId.current);
      }
      idleCallbackId.current = null;
    }
  }, [isSupported]);
  /**
   * 请求空闲回调
   *
   * @param callback - 在浏览器空闲时执行的回调函数
   * @param options - 可选的配置选项（如超时时间）
   * @returns 回调 ID，可用于取消操作
   */
  const request = useCallback(
    (
      callback: (handle: IdleCallbackHandle) => void,
      options?: IdleRequestOptions,
    ) => {
      // 先取消之前的回调，避免重复执行
      cancel();
      if (isSupported) {
        
        const params = options || { timeout }
        idleCallbackId.current = window.requestIdleCallback(callback, params);
      } else {
        // 浏览器不支持时，降级到 setTimeout
        // 使用 0 延迟确保在下一个事件循环中执行
        const timeoutId = setTimeout(() => {
          callback({
            didTimeout: false,
            timeRemaining: () => 50,
          });
        }, timeout);
        idleCallbackId.current = timeoutId as unknown as number;
      }

      return idleCallbackId.current;
    },
    [cancel, isSupported],
  );
  // 组件卸载时自动清理资源，防止内存泄漏
  useEffect(() => {
    return cancel;
  }, [cancel]);

  return {
    request,
    cancel,
    isSupported,
  };
}
