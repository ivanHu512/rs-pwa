import { images } from "@/assets/images";
import { cn } from "@/lib/utils";
import { PropsWithChildren, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ICommonDrawerProps {
  open: boolean;
  title?: React.ReactNode;
  wrapClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
  titleClassName?: string;
  destroyOnClose?: boolean;
  onClose?: () => void;
  onClickMask?: () => void;
  afterClose?: () => void;
}

/**
 * 通用抽屉组件
 */
const CommonDrawer = (props: PropsWithChildren<ICommonDrawerProps>) => {
  const {
    open,
    title,
    children,
    destroyOnClose,
    wrapClassName,
    containerClassName,
    contentClassName,
    titleClassName,
    onClose,
    onClickMask,
    afterClose,
  } = props;

  const [isVisible, setIsVisible] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsVisible(open);
  }, [open]);

  useEffect(() => {
    if (!isVisible) return;
    const html = document.documentElement;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      html.style.overflow = prevHtmlOverflow;
    };
  }, [isVisible]);

  const handleClose = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClose?.();
    afterClose?.();
  };

  if (!isVisible && destroyOnClose) return null;

  const modalContent = (
    <div
      ref={overlayRef}
      className={cn(
        "fixed inset-0 bg-black/80 flex justify-center items-center flex-col z-[var(--modal-z-index)] p-[1px] transition-all duration-300 overscroll-none touch-none",
        {
          "opacity-100": isVisible,
          "opacity-0 pointer-events-none": !isVisible,
        },
        wrapClassName,
      )}
      onClick={onClickMask}
    >
      <div
        className={cn(
          "absolute bottom-0 p-[16px_0px_24px] w-full rounded-t-[16px] flex flex-col max-h-[60%] bg-[rgba(20,20,20)] transition-transform duration-300 transform touch-auto overscroll-contain",
          isVisible ? "translate-y-0" : "translate-y-full",
          containerClassName,
        )}
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
        }}
      >
        <div className="px-[16px] flex-1 relative flex flex-col min-h-0">
          <div
            className={cn(
              "flex w-full justify-between items-center mb-[16px] top-0",
              titleClassName,
            )}
          >
            <div className="text-[16px] font-bold text-white/90">{title}</div>
            <div
              className="flex justify-center items-center"
              onClick={handleClose}
            >
              <img
                src={images.closeIcon}
                alt="close"
                className="w-[24px] h-[24px]"
              />
            </div>
          </div>
          <div
            className={cn(
              "w-full flex-1 min-h-0 overflow-auto overscroll-contain hide-scrollbar touch-pan-y",
              contentClassName,
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default CommonDrawer;
