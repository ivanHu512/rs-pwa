import { useI18n } from '@/i18n'
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
} from 'react'
import { useShallow } from 'zustand/shallow'

import LockedModal from '@/components/locked-modal'
import Toast from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { useCheckoutStore } from '@/stores/checkout-store'
import { useDramaStore } from '@/stores/drama-store'
import { ChapterLockStatus, PageRef, VideoPlayBtnTypeEnum } from '@/types/drama'
import { getOrderInfo } from '@/lib/checkout'

type PageProps = {
  /**章节id */
  id: string
}

const Page = forwardRef<PageRef, PageProps>(({ id }, ref) => {
  const { t } = useI18n()
  /** 控制提示付费弹窗 */
  const [lockedModalVisible, setLockedModalVisible] = useState(false)
  const [online, setOnline] = useState(true)
  const isCurrentChapterRef = useRef(false)
  // 合并store选择器，减少订阅次数
  const {
    setEnableSwipe,
    setShowControls,
    setShowPlayType,
    currentChapterId,
    currentIsLock,
    currentUnlockCost = 0,
    amount = 0,
    updateControlStatus,
  } = useDramaStore(
    useShallow((state) => ({
      setEnableSwipe: state.setEnableSwipe,
      setShowControls: state.setShowControls,
      setShowPlayType: state.setShowPlayType,
      currentChapterId: state.currentChapter.chapter_id,
      currentIsLock: state.currentChapter.is_lock,
      currentUnlockCost: state.currentChapter.unlock_cost,
      amount: state.accountInfo.coins + state.accountInfo.bonus,
      updateControlStatus: state.updateControlStatus,
    }))
  )
  const setOpenPayModal = useCheckoutStore((state) => state.setOpenPayModal)

  // 判断是否为当前章�?
  const isCurrentChapter = useMemo(
    () => currentChapterId === id,
    [currentChapterId, id]
  )
  const isAmount = useMemo(
    () => amount >= currentUnlockCost,
    [amount, currentUnlockCost]
  )
  useEffect(() => {
    isCurrentChapterRef.current = isCurrentChapter
    if (isCurrentChapter) {
      setOnline(navigator.onLine)
    }
  }, [isCurrentChapter])

  useEffect(() => {
    if (isCurrentChapter && lockedModalVisible) {
      updateControlStatus(false)
    }
  }, [lockedModalVisible, isCurrentChapter])

  // 合并处理锁定状态和弹窗显示的逻辑
  useEffect(() => {
    if (!isCurrentChapterRef.current) {
      setLockedModalVisible(false)
      setOpenPayModal(false)
      return
    }
    const isLocked = currentIsLock === ChapterLockStatus.LOCKED

    if (isLocked) {
      setEnableSwipe(false)
      if (!isAmount) {
        setLockedModalVisible(true)
        requestAnimationFrame(() => {
          setShowPlayType(VideoPlayBtnTypeEnum.PAUSE)
          setShowControls(false)
          // 支付重定向回来的不要弹出支付面板
          if (!sessionStorage.getItem('isRedirectPayBack')) {
            setOpenPayModal(true)
          }
          sessionStorage.removeItem('isRedirectPayBack')
        })
      }
    } else {
      setLockedModalVisible(false)
      setEnableSwipe(true)
    }
  }, [
    isAmount,
    currentIsLock,
    setEnableSwipe,
    setShowControls,
    setShowPlayType,
    setOpenPayModal,
  ])

  /** 主动调用 */
  useImperativeHandle(
    ref,
    () => ({
      // setShowCover,
      setLockedModalVisible,
    }),
    []
  )
  /**
   * 处理网络错误点击事件
   */
  const handleNetworkError = useCallback(() => {
    if (navigator.onLine) {
      location.reload()
    } else {
      Toast.show(t('video.network-error'))
    }
  }, [t])
  /**
   * 样式计算 - 优化依赖�?
   */
  const styles = useMemo(
    () => ({
      outStyle: {
        visibility: !online ? 'visible' : 'hidden',
      } as CSSProperties,
      indexStyle: {
        zIndex: !online ? 60 : -1,
        visibility: !online ? 'visible' : 'hidden',
      } as CSSProperties,
    }),
    [online]
  )
  return (
    <>
      <div
        className={cn(
          'absolute z-[48] flex h-full w-full items-center justify-center'
        )}
        style={styles.indexStyle}
      >
        <img
          className='absolute z-[20] h-[64px] w-[64px]'
          style={styles.outStyle}
          src={
            'https://v-mps.crazymaplestudios.com/images/17357c10-c916-11f0-84ad-6b5693b490dc.png'
          }
          alt=''
          onClick={handleNetworkError}
          onTouchEnd={(e) => {
            e.stopPropagation()
            handleNetworkError()
          }}
          // loading="lazy"
        />
      </div>
      {/* 充值提示弹�?*/}
      <LockedModal
        isOpen={lockedModalVisible}
        onOpenChange={setLockedModalVisible}
      />
    </>
  )
})

Page.displayName = 'videoItemPage'

const areEqual = (prevProps: PageProps, nextProps: PageProps) =>
  prevProps.id === nextProps.id

export default memo(Page, areEqual)
