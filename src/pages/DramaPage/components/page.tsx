import React, {
  CSSProperties,
  forwardRef,
  memo,
  RefObject,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { useShallow } from "zustand/shallow";
import LockedModal from "./LockedModal";
import CommonToast from "@/components/common/CommonToast";
import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n";
// import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from "@/stores/drama-store";
import {
  ChapterLockStatus,
  PageRef,
  VideoPlayBtnTypeEnum,
} from "@/types/drama";
import { NormalPopupRef } from "@/types/common";
// import { getOrderInfo } from '@/lib/checkout'

type PageProps = {
  /**章节id */
  id: string;
  /** 商城drawer实例 */
  payDrawerRef: React.RefObject<NormalPopupRef>;
};

const Page = forwardRef<PageRef, PageProps>(({ id, payDrawerRef }, ref) => {
  const { t } = useI18n();
  /** 控制提示付费弹窗 */
  const [lockedModalVisible, setLockedModalVisible] = useState(false);
  const [online, setOnline] = useState(true);
  const isCurrentChapterRef = useRef(false);
  // 合并store选择器，减少订阅次数
  const {
    userInfo,
    setEnableSwipe,
    setShowControls,
    setShowPlayType,
    currentChapterId,
    currentIsLock,
    currentUnlockCost = 0,
    updateControlStatus,
  } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      setEnableSwipe: state.setEnableSwipe,
      setShowControls: state.setShowControls,
      setShowPlayType: state.setShowPlayType,
      currentChapterId: state.currentChapter.chapter_id,
      currentIsLock: state.currentChapter.is_lock,
      currentUnlockCost: state.currentChapter.unlock_cost,
      updateControlStatus: state.updateControlStatus,
    })),
  );
  const { coins = 0, bonus = 0 } = userInfo?.account || {};
  const amount = coins + bonus;
  // 判断是否为当前章节
  const isCurrentChapter = useMemo(
    () => currentChapterId === id,
    [currentChapterId, id],
  );
  const isAmount = useMemo(
    () => amount >= currentUnlockCost,
    [amount, currentUnlockCost],
  );
  useEffect(() => {
    isCurrentChapterRef.current = isCurrentChapter;
    if (isCurrentChapter) {
      setOnline(navigator.onLine);
    }
  }, [isCurrentChapter]);

  useEffect(() => {
    if (isCurrentChapter && lockedModalVisible) {
      updateControlStatus(false);
    }
  }, [lockedModalVisible, isCurrentChapter]);

  // 合并处理锁定状态和弹窗显示的逻辑
  useEffect(() => {
    if (!isCurrentChapterRef.current) {
      setLockedModalVisible(false);
      payDrawerRef.current?.close();
      return;
    }
    const isLocked = currentIsLock === ChapterLockStatus.LOCKED;
    if (isLocked) {
      setEnableSwipe(false);
      if (!isAmount) {
        setLockedModalVisible(true);
        requestAnimationFrame(() => {
          setShowPlayType(VideoPlayBtnTypeEnum.PAUSE);
          setShowControls(false);
          // 支付重定向回来的不要弹出支付面板
          if (!sessionStorage.getItem("isRedirectPayBack")) {
            payDrawerRef.current?.open();
          }
          sessionStorage.removeItem("isRedirectPayBack");
        });
      }
    } else {
      setLockedModalVisible(false);
      setEnableSwipe(true);
    }
  }, [
    isAmount,
    currentIsLock,
    setEnableSwipe,
    setShowControls,
    setShowPlayType,
  ]);

  /** 主动调用 */
  useImperativeHandle(
    ref,
    () => ({
      // setShowCover,
      setLockedModalVisible,
    }),
    [],
  );
  /**
   * 处理网络错误点击事件
   */
  const handleNetworkError = useCallback(() => {
    if (navigator.onLine) {
      location.reload();
    } else {
      CommonToast.show(t("toast.network-timeout"));
    }
  }, [t]);
  /**
   * 样式计算 - 优化依赖项
   */
  const styles = useMemo(
    () => ({
      outStyle: {
        visibility: !online ? "visible" : "hidden",
      } as CSSProperties,
      indexStyle: {
        zIndex: !online ? 60 : -1,
        visibility: !online ? "visible" : "hidden",
      } as CSSProperties,
    }),
    [online],
  );
  return (
    <>
      <div
        className={cn(
          "absolute z-[48] flex h-full w-full items-center justify-center",
        )}
        style={styles.indexStyle}
      >
        <img
          className="absolute z-[20] h-[64px] w-[64px]"
          style={styles.outStyle}
          src={
            "https://v-mps.crazymaplestudios.com/images/17357c10-c916-11f0-84ad-6b5693b490dc.png"
          }
          alt=""
          onClick={handleNetworkError}
          onTouchEnd={(e) => {
            e.stopPropagation();
            handleNetworkError();
          }}
        />
      </div>
      {/* 充值提示弹窗 */}
      <LockedModal isOpen={lockedModalVisible} payDrawerRef={payDrawerRef} />
    </>
  );
});

Page.displayName = "videoItemPage";

const areEqual = (prevProps: PageProps, nextProps: PageProps) =>
  prevProps.id === nextProps.id;

export default memo(Page, areEqual);
