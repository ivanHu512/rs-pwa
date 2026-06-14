import Image, { ImageProps, StaticImageData } from 'next/image'
import { useTranslations } from 'next-intl'
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { Modal } from '@/components/dialog'
import { Button } from '@/components/ui/button'
import { useOneLink } from '@/hooks/use-nav-chapter'
import { useDramaStore } from '@/stores/drama-store'
const AppModal: React.FC<{
  container?: HTMLElement | null
}> = ({ container }) => {
  const { jumpOneLink } = useOneLink()
  const { currentChapter, appModalVisible, updateAppModalVisible } =
    useDramaStore(
      useShallow((state) => ({
        currentChapter: state.currentChapter,
        appModalVisible: state.appModalVisible,
        updateAppModalVisible: state.updateAppModalVisible,
      }))
    )
  const t = useTranslations()
  /** 当前章节的背景 */
  const cover = useMemo(() => {
    return currentChapter?.video_pic
  }, [currentChapter?.video_pic])

  // /**
  //  * 关闭界面上报
  //  */
  // useEffect(() => {
  //   !appModalVisible && appDownloadReport({ _action: "close" })
  // }, [appModalVisible])
  return (
    <Modal
      isOpen={appModalVisible}
      onOpenChange={updateAppModalVisible}
      container={container}
      className='z-[50] h-full rounded-none border-0 bg-black/75 p-0 shadow-none sm:max-w-full'
    >
      <div className='relative mx-auto flex w-full max-w-xl flex-col items-center justify-center px-4'>
        {cover && (
          <Image
            priority
            unoptimized
            src={cover}
            width={350}
            height={600}
            className='absolute z-[-1] !h-auto !w-full'
            alt=''
          />
        )}
        <div
          className='absolute flex h-full w-full flex-col items-center justify-center bg-black/75 px-[32px]'
          style={{
            backdropFilter: 'blur(10px)',
          }}
        >
          <div className='mb-[24px] text-center text-[20px] font-[700] text-white/90'>
            {t('video.not-stop')}
          </div>
          <div className='w-full px-[50px]'>
            <Button
              className='flex h-[48px] w-full items-center justify-center gap-1 rounded-[4px] text-[16px] font-[700] text-white/90'
              onClick={jumpOneLink}
            >
              {t('video.get-app')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default AppModal
