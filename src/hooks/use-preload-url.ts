import { useCallback, useEffect, useRef } from 'react';

import { useRequestIdle } from "@/hooks/use-requestIdle";
import { fetchM3U8Ts } from "@/lib/preload"
import { BookPreLoadType,ChapterItem } from '@/types/drama';
interface UsePreloadChapterOptions {
  /** 预加载优先级，默认为 'low' */
  priority?: RequestPriority;
}
interface UsePreloadChapterReturn {
  /** 手动预加载方法 */
  preload: (chapter: ChapterItem | BookPreLoadType, id: string) => Promise<void>;
  /** 取消当前预加载 */
  cancel: () => void;
}
/**
 * 预加载章节视频资源的 hook
 * @param options 配置选项
 * @returns 预加载方法和状态
 */
export const usePreloadUrl = (
  options?: UsePreloadChapterOptions
): UsePreloadChapterReturn => {
  const { request } = useRequestIdle();
  const { priority = 'low' } = options || {};
  const abortControllerRef = useRef<AbortController | null>(null);
  /** 记录已经请求过的 URL，避免重复请求 */
  const requestedUrlsRef = useRef<Set<string>>(new Set());
  /**
   * 执行预加载
   * @param targetChapter 要预加载的章节
   */
  const preload = useCallback((targetChapter: ChapterItem | BookPreLoadType, id: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      /**取消之前的请求 */
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const url = targetChapter.url;
      if (!url) {
        console.warn("无法获取章节播放地址")
        resolve();
        return;
      }
      /** 如果 URL 已经请求过，直接返回 */
      if (requestedUrlsRef.current.has(url)) {
        console.log('URL 已预加载过，跳过:', url);
        resolve();
        return;
      }
      /**创建新的 AbortController */
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const fetchOptions: RequestInit = {
        method: 'GET',
        signal: abortController.signal,
      };
      
      if ('priority' in Request.prototype) {
        (fetchOptions as any).priority = priority;
      }
      /** 标记 URL 为已请求 */
      requestedUrlsRef.current.add(url);
      /** 选择在空闲时机发起请求 */
      request(() => {
        fetchM3U8Ts({
          m3u8Url: targetChapter?.url || "",
          chapterId: targetChapter?.chapter_id,
          id
        }, 3);
        resolve();
        // fetch(url, fetchOptions)
        //   .then((response) => {
        //     if (abortController.signal.aborted) {
        //       return;
        //     }
        //     if (response.ok || response.status === 206) {
        //       console.log('章节资源预加载成功:', targetChapter?.chapter_id, url);
        //       resolve();
        //     } else {
        //       throw new Error(`预加载失败: ${response.status} ${response.statusText}`);
        //     }
        //   })
        //   .catch((error) => {
        //     if (abortController.signal.aborted) {
        //       return;
        //     }
        //     if (error.name === 'AbortError') {
        //       return;
        //     }
        //     console.warn('章节预加载失败:', targetChapter?.chapter_id, url, error);
        //     reject(error);
        //   });
      });
    });
  }, [request, priority]);
  /**
   * 取消当前预加载
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);
  useEffect(() => {
    return () => {
      cancel();
    };
  }, [cancel]);

  return {
    preload,
    cancel,
  };
};

