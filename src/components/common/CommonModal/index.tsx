import { PropsWithChildren, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./index.module.scss";
import { cn } from "@/lib/utils";
import { images } from "@/assets/images";
import i18n from "@/i18n/instance";

export interface ICommonModalProps {
  open: boolean;
  wrapClassName?: string;
  containerClassName?: string;
  contentClassName?: string;
  iconClose?: boolean;
  destroyOnClose?: boolean;
  onClose?: () => void;
  onClickCloseBtn?: () => void;
  onClickMask?: () => void;
  afterClose?: () => void;
}

const CommonModal = (props: PropsWithChildren<ICommonModalProps>) => {
  const {
    open,
    children,
    wrapClassName,
    containerClassName,
    contentClassName,
    iconClose = true,
    destroyOnClose = true,
    onClose,
    onClickCloseBtn,
    onClickMask,
    afterClose,
  } = props;

  const [isVisible, setIsVisible] = useState(open);
  const [isMounted, setIsMounted] = useState(open);

  useEffect(() => {
    if (open) {
      setIsMounted(true);
      setTimeout(() => {
        setIsVisible(true);
      }, 10);
    } else {
      setIsVisible(false);
    }
  }, [open]);

  const handleClose = () => {
    onClose?.();
    afterClose?.();
    if (destroyOnClose) {
      setIsMounted(false);
    }
  };

  const handleClickCloseBtn = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    onClickCloseBtn?.();
    handleClose();
  };

  return createPortal(
    isMounted && (
      <div
        key="modal-overlay"
        className={cn(
          "common-modal fixed inset-0 bg-black/70 flex justify-center items-center flex-col z-[var(--modal-z-index)]",
          !isVisible && "hidden",
          wrapClassName,
        )}
        onClick={onClickMask}
      >
        <div
          key="modal-content"
          className={cn(styles.modalContainer, containerClassName)}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={cn(
              "w-[315px] min-h-[215px] rounded-[calc(16px*0.94)]",
              contentClassName,
            )}
          >
            {children}
            {iconClose && (
              <div
                className={cn(
                  "absolute cursor-pointer",
                  "-bottom-[64px] left-[calc(50%-16px)]",
                )}
                onClick={handleClickCloseBtn}
              >
                <img
                  src={images.modalCloseIcon}
                  className="w-[32px] h-[32px]"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    ),
    document.body,
  );
};

export default CommonModal;
