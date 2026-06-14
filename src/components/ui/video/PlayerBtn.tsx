'use client';
import type { MouseEvent as ReactMouseEvent, TouchEvent as ReactTouchEvent } from 'react';
import React, { CSSProperties,memo, useCallback, useMemo } from "react";

import { VideoPlayBtnTypeEnum } from "@/types/drama"

type UnifiedEvent = ReactMouseEvent<HTMLElement> | ReactTouchEvent<HTMLElement>;

interface PlayerBtnProps {
  /**展示按钮类型 */
  showPlayType: VideoPlayBtnTypeEnum;
  /**是否展示按钮 */
  visible: boolean;
  /**按钮操作，触发双击逻辑 */
  onVideoPlayClick?: (flag?: boolean) => void;
}

const PlayerBtn: React.FC<PlayerBtnProps> = ({ 
  visible, 
  showPlayType,
  onVideoPlayClick
}) => {
  /**
   * 点击状态按钮
   */
  const handleButtonClick = useCallback((event: UnifiedEvent) => {
    event.stopPropagation()
    onVideoPlayClick?.(true)
  }, [onVideoPlayClick])
  /**
   * 样式计算
   */
  const styles = useMemo(
    () => ({
      outStyle: {
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "inherit" : "none"
      } as CSSProperties,
      playStyle: {
        visibility: showPlayType === VideoPlayBtnTypeEnum.PLAY ? 'visible' : 'hidden'
      } as CSSProperties,
      pauseStyle: {
        visibility: showPlayType === VideoPlayBtnTypeEnum.PAUSE ? 'visible' : 'hidden'
      } as CSSProperties
    }),
    [visible, showPlayType]
  )
  return (
    <>
      <div
        className="absolute h-[64px] w-[64px] bg-contain bg-no-repeat z-[100]"
        onClick={handleButtonClick}
        onTouchEnd={handleButtonClick}
        style={styles.outStyle}
      >
        <img
          className="absolute h-full w-full"
          fetchPriority="high"
          src={
            "https://v-mps.crazymaplestudios.com/images/84dcee10-c4ed-11f0-84ad-6b5693b490dc.png"
          }
          alt=""
          style={styles.playStyle}
        />
        <img
          fetchPriority="high"
          className="absolute h-full w-full"
          src={
            "https://v-mps.crazymaplestudios.com/images/84dbdca0-c4ed-11f0-84ad-6b5693b490dc.png"
          }
          alt=""
          style={styles.pauseStyle}
        />
      </div>
    </>
  );
};

export default memo(PlayerBtn);