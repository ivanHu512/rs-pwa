import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn, formatTime } from "@/lib/utils";
import { VideoPlayBtnTypeEnum } from "@/types/drama";
import PlayerLoading from "./PlayerLoading";

interface ProgressBarProps {
  /**当前时间 */
  currentTime: number;
  /**视频总时长 */
  duration: number;
  /**选择时间，用于改变时间 */
  onSeek: (time: number, skip?: boolean) => void;
  onVolume?: () => void;
  /**展示按钮类型 */
  showPlayType: VideoPlayBtnTypeEnum;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({
  currentTime,
  duration,
  showPlayType,
  onSeek,
  onVolume,
  className,
}) => {
  /**可点击区域实例 */
  const progressZoneRef = useRef<HTMLDivElement>(null);
  /**总进度条实例 */
  const progressBarRef = useRef<HTMLDivElement>(null);
  /**当前进度条实例 */
  const progressRef = useRef<HTMLDivElement>(null);
  /**是否正在移动进度条 */
  const [isDragging, setIsDragging] = useState(false);
  /**拖动过程中显示粗进度条 */
  const [isThickProgressBar, setIsThickProgressBar] = useState(false);
  /**记录总进度条属性 */
  const progressBarRefRectRef = useRef<DOMRect | null>(null);
  /**根据当前时长，计算进度条百分比 */
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  /**
   * 开始拖动,标记
   * @param clickX 点击的位置
   */
  const handleStart = useCallback(
    (clientX: number) => {
      setIsDragging(true);
      if (!progressBarRef.current) return;
      progressBarRefRectRef.current =
        progressBarRef.current.getBoundingClientRect();
    },
    [isDragging],
  );
  /**
   * 拖动中，计算比例
   * @param clickX 点击的位置
   */
  const handleMove = useCallback(
    (clientX: number) => {
      if (isDragging) {
        handleSeek(clientX, true);
        setIsThickProgressBar(true);
      }
    },
    [setIsThickProgressBar, isDragging],
  );
  /**
   * 拖动结束，标记结束
   * @param clickX 点击的位置
   */
  const handleEnd = useCallback(() => {
    setIsDragging(false);
    setIsThickProgressBar(false);
  }, [setIsThickProgressBar]);
  /**
   * 计算拖动或者点击进度条之后的比例
   * 得到即将需要播放的时间节点
   * @param clickX 点击的位置
   * @param skip 是否需要调整播放进度
   */
  const handleSeek = useCallback(
    (clientX: number, skip?: boolean) => {
      if (!progressBarRef.current || !progressRef.current) return;
      const { left = 0, width = 0 } = progressBarRefRectRef.current || {};
      const clickX = clientX - left;
      const percentage = clickX / width;
      const newTime = percentage * duration;
      onSeek(Math.max(0, Math.min(newTime, duration)), skip);
    },
    [duration, onSeek],
  );
  /**
   * 原生触摸事件监听器
   * 消除swiper滚动副作用
   */
  useEffect(() => {
    const container = progressZoneRef.current;
    if (!container) return;
    const handleTouchStart = (e: TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.touches.length > 0) {
        handleStart(e.touches[0].clientX);
      }
    };
    const handleTouchEnd = (e: TouchEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (e.changedTouches.length > 0) {
        onVolume?.();
        handleEnd();
        handleSeek(e.changedTouches[0].clientX);
      }
    };
    container.addEventListener("touchstart", handleTouchStart);
    container.addEventListener("touchend", handleTouchEnd);
    return () => {
      container.removeEventListener("touchstart", handleTouchStart);
      container.removeEventListener("touchend", handleTouchEnd);
    };
  }, [handleStart, isDragging, showPlayType]);

  return (
    <div className="w-full h-[30px] relative">
      {!isDragging && showPlayType === VideoPlayBtnTypeEnum.LOADING ? (
        <PlayerLoading />
      ) : (
        <div
          ref={progressZoneRef}
          className={cn(
            "relative flex items-end justify-center w-full h-full",
            className,
          )}
          onMouseDown={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleStart(e.clientX);
          }}
          onMouseMove={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleMove(e.clientX);
          }}
          onMouseUp={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleEnd();
          }}
          onMouseLeave={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleEnd();
          }}
          // onTouchStart={(e: React.TouchEvent) => {
          //   e.stopPropagation();
          //   e.preventDefault();
          //   if (e.touches.length > 0) {
          //     handleStart(e.touches[0].clientX);
          //   }
          // }}
          onTouchMove={(e: React.TouchEvent) => {
            e.stopPropagation();
            handleMove(e.touches[0].clientX);
          }}
          // onTouchEnd={(e: React.TouchEvent) => {
          //   e.stopPropagation();
          //   e.preventDefault();
          //   if (e.changedTouches.length > 0) {
          //     onVolume?.();
          //     handleEnd(e.changedTouches[0].clientX);
          //     handleSeek(e.changedTouches[0].clientX);
          //   }
          // }}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation();
            handleSeek(e.clientX);
          }}
        >
          {isThickProgressBar && (
            <div className="absolute top-[-30px] text-[16px] text-white/90">
              <span className="font-[700]">{formatTime(currentTime)}</span>
              <span className="font-[400] opacity-50">
                /{formatTime(duration)}
              </span>
            </div>
          )}
          <div
            ref={progressBarRef}
            className={cn(
              "flex-1 h-[2px] bg-white/10 cursor-pointer relative group",
              isThickProgressBar && "h-[16px]",
            )}
          >
            <div
              ref={progressRef}
              className="h-full bg-white/90 rounded-tr-[1px] rounded-br-[1px] transition-all duration-150"
              style={{
                width: `${progress}%`,
                willChange: "transform",
                transformOrigin: "left center",
                transition: "none",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};
export default memo(ProgressBar);
