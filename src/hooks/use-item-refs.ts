import { useCallback, useMemo,useRef } from 'react';

/**
 * 用于管理多个元素引用的自定义 Hook
 * @returns 返回设置引用、获取元素位置和滚动到指定元素的方法
 */
export function useItemRefs() {
  const refsMap = useRef<Map<number | string, HTMLDivElement>>(new Map());
  /**
   * @param id 项目的唯一标识符
   * @returns 返回一个 ref 回调函数，用于绑定到 DOM 元素
   */
  const setRef = useCallback((id: number | string) => (element: HTMLDivElement | null) => {
    if (element) {
      refsMap.current.set(id, element);
    } else {
      refsMap.current.delete(id);
    }
  }, []);

  /**
   * @param id 项目的唯一标识符
   * @returns 返回元素的 DOMRect 对象，如果元素不存在则返回 null
   */
  const getItemRect = useCallback((id: number | string): DOMRect | null => {
    const element = refsMap.current.get(id);
    return element ? element.getBoundingClientRect() : null;
  }, []);

  /**
   * 滚动到指定的项目
   * @param id 项目的唯一标识符
   * @param options 滚动选项，默认为平滑滚动
   */
  const scrollToItem = useCallback((id: number | string, options: ScrollIntoViewOptions = {}) => {
    const element = refsMap.current.get(id);
    element?.scrollIntoView({ behavior: 'smooth', ...options });
  }, []);
  return { setRef, getItemRect, scrollToItem };
}