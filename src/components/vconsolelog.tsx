'use client'

import Script from 'next/script'

export default function VConsolelog() {
  return (
    <>
      {process.env.NEXT_PUBLIC_APP_ENV !== 'production' && (
        <Script
          src='https://unpkg.com/vconsole@latest/dist/vconsole.min.js'
          onLoad={() => {
            // 类型安全的 VConsole 初始化
            if (typeof window !== 'undefined' && window.VConsole) {
              new window.VConsole()
            }
          }}
        />
      )}
    </>
  )
}
