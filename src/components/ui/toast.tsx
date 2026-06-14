import React from 'react'
import ReactDOM from 'react-dom/client'

import { cn } from "@/lib/utils";

export interface ICommonToastProps {
  /** 为0时不消失 */
  duration?: number
  afterClose?: () => void
}

const ToastContent = ({ content }: { content: React.ReactNode }) => {
  return (
    <div
      className={cn(
        'fixed inset-0 bg-transparent flex justify-center items-center flex-col z-[1000]',
        'transition-opacity duration-300'
      )}
      style={{
        pointerEvents: 'none'
      }}
    >
      <div
        className={cn(
          'text-[14px] font-[400] px-[16px] py-[10px] bg-[#3D3D3D] rounded-[8px] text-white/90 max-w-[80vw] text-center',
        )}
      >
        {content}
      </div>
    </div>
  )
}

const DEFAULT_DURATION = 2000

class Toast {
  static show(content: React.ReactNode, options?: ICommonToastProps) {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const close = () => {
      document.body.removeChild(container)
      options?.afterClose?.()
    }

    let duration = DEFAULT_DURATION
    if (options && 'duration' in options) {
      duration = options.duration ?? DEFAULT_DURATION
    }

    duration &&
      setTimeout(() => {
        close()
      }, duration)

    ReactDOM.createRoot(container).render(<ToastContent content={content} />)
  }
}

export default Toast
