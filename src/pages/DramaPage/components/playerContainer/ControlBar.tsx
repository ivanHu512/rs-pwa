import React, {
  memo,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useShallow } from "zustand/shallow";
import { useI18n } from "@/i18n";
// import { useReport } from "@/hooks/use-report";
// import { useRequestIdle } from "@/hooks/use-requestIdle"
import { cn } from "@/lib/utils";
import { useDramaStore } from "@/stores/drama-store";
import { VideoPlayBtnTypeEnum } from "@/types/drama";
import PlayerLoading from "./PlayerLoading";

// 控制栏动画的持续时间（毫秒）
const delay = 300;

interface IProps {
  className?: string;
  serialNumber?: number;
  children: React.ReactNode;
  onVolume?: () => void;
  /**展示按钮类型 */
  showPlayType: VideoPlayBtnTypeEnum;
}
/**
 * 短剧控制栏组件
 * 功能：显示当前话数、提供全屏切换功能，支持自动隐藏
 */
const ControlBar: React.FC<IProps> = ({
  showPlayType,
  serialNumber = 0,
  className,
  children,
  onVolume,
}) => {
  const drawerContainerRef = useRef<HTMLDivElement>(null);
  const { chapterList, currentChapter, controlStatus, updateDrawerVisible } =
    useDramaStore(
      useShallow((state) => ({
        chapterList: state.chapterList,
        currentChapter: state.currentChapter,
        controlStatus: state.controlStatus,
        updateDrawerVisible: state.updateDrawerVisible,
      })),
    );
  // const { customEventReport } = useReport();
  const { t } = useI18n();
  // const { request } = useRequestIdle()
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  /** 控制条区域 */
  const controlBarRef = useRef<HTMLDivElement>(null);
  const currentSerialNumber = currentChapter.serial_number || 0;
  const totalChapterNum =
    chapterList[chapterList.length - 1]?.serial_number ?? serialNumber;
  /**
   * 3s，导航条消失，逻辑待定
   */
  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout>;
    let shotTimer: ReturnType<typeof setTimeout>;
    if (controlStatus) {
      setShouldRender(true);
      shotTimer = setTimeout(() => {
        setIsVisible(true);
      }, 10);
    } else {
      if (shouldRender) {
        setIsVisible(false);
        hideTimer = setTimeout(() => {
          setShouldRender(false);
        }, delay);
      }
    }
    return () => {
      clearTimeout(hideTimer);
      // clearTimeout(shotTimer);
    };
  }, [controlStatus]);
  /**
   * 原生触摸事件监听器
   * 消除父元素副作用
   */
  // useEffect(() => {
  //   const container = controlBarRef.current;
  //   if (!container) return;
  //   const emptyHandler = (e: TouchEvent) => {
  //     e.stopPropagation();
  //   };
  //   const handleTouchEnd = (e: TouchEvent) => {
  //     e.stopPropagation();
  //     e.preventDefault();
  //     updateDrawerVisible(true);
  //     onVolume?.();
  //   };
  //   container.addEventListener("touchstart", emptyHandler, { capture: true });
  //   container.addEventListener("touchend", handleTouchEnd, { capture: true });
  //   return () => {
  //     container.removeEventListener("touchstart", emptyHandler);
  //     container.removeEventListener("touchend", handleTouchEnd);
  //   };
  // }, [shouldRender]);

  if (!shouldRender) {
    if (showPlayType === VideoPlayBtnTypeEnum.LOADING) {
      return (
        <PlayerLoading
          className="absolute"
          textClassName="items-end"
          style={{
            bottom: "env(safe-area-inset-bottom, 2px)",
          }}
        />
      );
    }
    return null;
  }
  return (
    <div
      className={cn(
        "absolute left-0 bottom-0 z-[49] w-full transition-opacity duration-300",
        isVisible ? "opacity-100" : "opacity-0",
        className,
      )}
    >
      {children}
      <div
        className="bg-[rgba(0,0,0,0.65)]"
        ref={controlBarRef}
        onClick={() => {
          updateDrawerVisible(true);
          onVolume?.();
        }}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div
          className={cn(
            "mx-auto max-w-xl text-[12px] font-[500]",
            "flex items-center justify-between",
            "h-[48px] px-[16px]",
          )}
        >
          <div className="flex items-center">
            <i className="mr-[4px] block w-[16px] h-[16px] bg-[url(https://v-mps.crazymaplestudios.com/images/1b578b90-c4f1-11f0-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat"></i>
            <label className="text-white/90">
              {t("video.ep", { num: currentSerialNumber })}
            </label>
            <label className="text-white/50">
              /{t("video.ep", { num: totalChapterNum })}
            </label>
          </div>
          {/* 信息图标 */}
          <i
            className={cn(
              "flex h-[16px] w-[16px]",
              "bg-contain bg-center bg-no-repeat",
              "bg-[url(https://v-mps.crazymaplestudios.com/images/465603d0-c4f1-11f0-84ad-6b5693b490dc.png)]",
            )}
          ></i>
        </div>
      </div>
    </div>
  );
};

export default memo(ControlBar);
