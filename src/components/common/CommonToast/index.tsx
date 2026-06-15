import { cn } from "@/lib/utils";
import React from "react";
import ReactDOM from "react-dom/client";

export interface ICommonToastProps {
  /** 为0时不消失 */
  duration?: number;
  contentClassName?: string;
  wrapperClassName?: string;
  afterClose?: () => void;
}

const ToastContent = ({
  content,
  contentClassName,
  wrapperClassName,
}: {
  content: React.ReactNode;
  contentClassName?: string;
  wrapperClassName?: string;
}) => {
  return (
    <div
      className={cn(
        "fixed inset-0 bg-transparent flex justify-center items-center flex-col z-[var(--common-toast-z-index)]",
        "transition-opacity duration-300",
        wrapperClassName,
      )}
    >
      <div
        className={cn(
          "p-[16px] bg-[#3D3D3D] rounded-[8px] text-white max-w-[80vw] text-center text-[14px]",
          contentClassName,
        )}
      >
        {content}
      </div>
    </div>
  );
};

const DEFAULT_DURATION = 2000;

class CommonToast {
  static show(content: React.ReactNode, options?: ICommonToastProps) {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const close = () => {
      document.body.removeChild(container);
      options?.afterClose?.();
    };

    let duration = DEFAULT_DURATION;
    if (options && "duration" in options) {
      duration = options.duration ?? DEFAULT_DURATION;
    }

    if (duration) {
      setTimeout(() => {
        close();
      }, duration);
    }

    ReactDOM.createRoot(container).render(
      <ToastContent
        content={content}
        contentClassName={options?.contentClassName}
        wrapperClassName={options?.wrapperClassName}
      />,
    );
  }
}

export default CommonToast;
