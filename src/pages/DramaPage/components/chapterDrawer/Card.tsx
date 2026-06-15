import { useI18n } from "@/i18n";
import React, { memo, useMemo } from "react";
import { useShallow } from "zustand/shallow";

import { cn, isUserVip } from "@/lib/utils";
import { useDramaStore } from "@/stores/drama-store";
import { ChapterLockStatus, VideoType, VipRewardTypeEnum } from "@/types/drama";

interface ChapterCardProps {
  id?: string;
  serial_number?: number;
  video_type?: VideoType;
  vip_free?: number;
  is_lock?: ChapterLockStatus;
}

const ChapterCard: React.FC<ChapterCardProps> = ({
  vip_free,
  id,
  is_lock,
  serial_number,
  video_type,
}) => {
  const {
    userInfo,
    currentChapter
  } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      currentChapter: state.currentChapter,
    })),
  );
  const accountInfo = userInfo?.account;
  const { t } = useI18n();

  /**
   * 渲染不同内容
   */
  const contentModule = useMemo(() => {
    if (serial_number === 0 && video_type === VideoType.trailer) {
      return (
        <label className="text-[14px] font-[500] text-white/50">
          {t("video.trailer")}
        </label>
      );
    }
    return (
      <label className="text-[14px] font-[500] text-white/90">
        {serial_number}
      </label>
    );
  }, [serial_number, video_type]);
  /**
   * 渲染不同章节类型
   */
  const tagModule = useMemo(() => {
    if (is_lock === ChapterLockStatus.LOCKED) {
      // return (
      //   <div
      //     className={cn(
      //       'absolute right-0 top-0 flex h-[14px] w-[16px] items-center justify-center rounded-bl rounded-tr',
      //       'bg-primary'
      //     )}
      //     style={{ background: config?.lockBg }}
      //   >
      //     <i
      //       className='block h-[12px] w-[12px] bg-contain bg-center bg-no-repeat'
      //       style={{
      //         backgroundImage: `url(${'https://v-mps.crazymaplestudios.com/images/65a20e50-1b7c-11f1-84ad-6b5693b490dc.png'})`,
      //       }}
      //     ></i>
      //   </div>
      // )
      return (
        <i className="absolute right-0 top-0 block h-[14px] w-[16px] bg-[url('https://v-mps.crazymaplestudios.com/images/d21145f0-e0c2-11f0-84ad-6b5693b490dc.png')] bg-contain bg-no-repeat"></i>
      );
    }
    const isVip = isUserVip(accountInfo) && vip_free === 1;
    const vipTag = (
      <i className="absolute right-0 top-0 block h-[14px] w-[24px] bg-[url('https://v-mps.crazymaplestudios.com/images/2068a9a0-e0c3-11f0-84ad-6b5693b490dc.png')] bg-contain bg-no-repeat"></i>
    );

    if (id === currentChapter.chapter_id) {
      return (
        <>
          {isVip && vipTag}
          <div className="absolute h-full w-full">
            <img
              className="absolute bottom-[2px] right-[2px] h-[12px] w-[12px]"
              src="https://v-mps.crazymaplestudios.com/images/f24458e0-c6ae-11f0-84ad-6b5693b490dc.gif"
              alt=""
            />
          </div>
        </>
      );
    }
    if (isVip) {
      return vipTag;
    }
    return <></>;
  }, [id, is_lock, currentChapter.chapter_id, accountInfo]);

  return (
    <div
      className={cn(
        "relative flex h-full w-full items-center justify-center px-[4px]",
        id === currentChapter.chapter_id &&
          "bg-[radial-gradient(116.67%_135.17%_at_95.16%_96%,rgba(255,61,93,0.32)_0%,rgba(45,45,45,0.00)_100%)]",
      )}
    >
      {contentModule}
      {tagModule}
    </div>
  );
};

export default memo(ChapterCard);
