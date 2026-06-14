'use client'

import { useScroll } from 'ahooks';
import { useEffect, useMemo,useState } from 'react'
import Header from "@/components/header"

export default function TopHeader() {
  const [bgColor, setBgColor] = useState(0);

  // 使用 useScroll 监听窗口滚动，返回的 scroll 对象包含滚动位置信息
  const scroll = useScroll(typeof window !== 'undefined' ? window?.document : null);
  // 根据滚动距离判断是否超过阈值（这里是100px），并更新状态
  // 注意：这里使用了防抖，避免状态过于频繁更新，优化性能
  useEffect(() => {
    const opacity = (scroll?.top || 0);
    if (opacity >= 100) {
      setBgColor(100)
    } else {
      setBgColor(opacity)
    }
  }, [scroll?.top]);

  const bgColorMemo = useMemo(() => {
    return bgColor
  }, [bgColor])
  return (
    <>
      <Header isShow style={{ backgroundImage: 'linear-gradient(0deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.50) 100%)', backgroundColor: `rgb(0 0 0 / ${bgColorMemo}%)` }} />
    </>
  )
}
