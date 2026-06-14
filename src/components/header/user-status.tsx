import { useThrottleFn } from 'ahooks'
import { useTranslations } from 'next-intl'
import React, { memo, useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/shallow'
import { images } from '@/assets/images'
import CustomerDrawer from '@/components/drawer'
import { Button } from '@/components/ui/button'
import Toast from '@/components/ui/toast'
import { reloadPage } from '@/lib'
import { getSiteConfigClient } from '@/lib/config/site'
import { cn, copy, isUserVip } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import { useLoginStore } from '@/stores/login-store'
import { LoginType } from '@/types/drama'
import { useJumpDramaPage } from '@/hooks/use-nav-drama'
import { useReport } from '@/hooks/use-report'
import { setReportPathName } from '@/lib/index'
import { usePathname } from 'next/navigation'

const iconMap: Partial<Record<LoginType, string>> = {
  [LoginType.FB]: images.facebookIcon,
  [LoginType.APPLE]: images.appleIcon,
  [LoginType.TT]: images.ttIcon,
  [LoginType.GG]: images.ggIcon,
}

type IProps = {
  className?: string
}

const UserStatus: React.FC<IProps> = () => {
  const t = useTranslations()
  const { jumpToPage } = useJumpDramaPage()
  const { openUserInfoBubble, setOpenUserInfoBubble, setOpenLoginModal } =
    useLoginStore(
      useShallow((state) => ({
        openUserInfoBubble: state.openUserInfoBubble,
        setOpenUserInfoBubble: state.setOpenUserInfoBubble,
        setOpenLoginModal: state.setOpenLoginModal,
      }))
    )
  const { userInfo, accountInfo } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      accountInfo: state.accountInfo,
    }))
  )
  const { pageClickReport } = useReport()
  const pathname = usePathname()
  const isVip = useMemo(() => isUserVip(accountInfo), [accountInfo])
  const siteConfig = useMemo(() => getSiteConfigClient(), [])

  /** 获取登录类型的icon */
  const loginIcon = useMemo(() => {
    return iconMap[userInfo?.sid || LoginType.VISITOR]
  }, [userInfo.sid])

  /**
   * 复制uid
   */
  const handleCopy = useCallback(() => {
    copy(String(userInfo?.uid || ''))
    Toast.show(t('video.copied'))
  }, [userInfo?.uid, t])

  /** 退出登录 */
  const { run: handleLogout } = useThrottleFn(
    () => {
      reloadPage(1)
      console.log('退出登录')
    },
    { wait: 1500, trailing: false }
  )

  return (
    <CustomerDrawer
      isOpen={openUserInfoBubble}
      onOpenChange={setOpenUserInfoBubble}
    >
      <div className='relative w-full text-white/90'>
        <div className='flex items-center'>
          <div
            className={cn(
              'relative mr-2 flex items-center justify-center',
              isVip ? 'h-[60px] w-[60px]' : 'ml-2 h-[48px] w-[48px]'
            )}
          >
            {isVip && (
              <div
                className='pointer-events-none absolute inset-0 z-[1] bg-contain bg-center bg-no-repeat'
                style={{
                  backgroundImage:
                    'url(https://v-mps.crazymaplestudios.com/images/b5ca73b0-12c4-11f1-84ad-6b5693b490dc.png)',
                }}
              />
            )}
            <img
              src={userInfo?.pic || images.defaultActor}
              className='h-[48px] w-[48px] rounded-full object-cover'
              alt=''
            />
          </div>
          <div className='flex flex-col text-[18px] font-[500]'>
            {userInfo.uname}
            <div className='mt-[4px] flex items-center'>
              {loginIcon && (
                <img
                  className='mr-[4px] h-[15px] w-[15px]'
                  src={loginIcon}
                  alt=''
                />
              )}
              <label className='mr-[4px] text-[14px] font-[400] text-white/50'>
                {t('video.uid')}:{userInfo?.uid}
              </label>
              <i
                className='h-[16px] w-[16px] min-w-[16px] cursor-pointer bg-[url(https://v-mps.crazymaplestudios.com/images/46556790-c4f1-11f0-84ad-6b5693b490dc.png)] bg-contain bg-no-repeat'
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopy()
                }}
              ></i>
            </div>
          </div>
        </div>

        {isVip && (
          <div
            className='mt-[12px] flex h-[120px] w-full items-center overflow-hidden rounded-[4px] border-[0.5px] border-transparent pl-[16px]'
            style={{
              background: siteConfig?.vipStatusBg,
            }}
          >
            <div className='mr-[12px] flex-1'>
              <div
                className='text-[16px] font-[700] leading-tight'
                style={{ color: siteConfig?.vipTextColor }}
              >
                {userInfo?.subscribe_entrance?.title}
              </div>
              <div
                className='mt-[8px] text-[10px] font-[400]'
                style={{ color: siteConfig?.vipTextColor2 }}
              >
                {userInfo?.subscribe_entrance?.subtitle}
              </div>
            </div>
            <div className='relative flex h-[120px] w-[156px] items-center justify-center'>
              {siteConfig?.vipBgMask && (
                <div
                  className='pointer-events-none absolute inset-0 bg-contain bg-center bg-no-repeat'
                  style={{ backgroundImage: `url(${siteConfig?.vipBgMask})` }}
                />
              )}
              <img
                src={siteConfig?.vipBigIcon}
                alt='crown'
                className='pointer-events-none absolute right-[16px] z-[1] w-auto'
                style={{
                  height: `${siteConfig?.vipBigIconHeight || 80}px`,
                  transform: `rotate(${siteConfig?.vipBigIconDeg || 0}deg)`,
                }}
              />
            </div>
          </div>
        )}

        <div className='mt-[12px] rounded-[4px] bg-[#222222] p-[16px]'>
          <div className='mb-2 text-[12px] font-[400] text-white/40'>
            {t('checkout.account-balance')}
          </div>
          <div className='flex items-center gap-1.5'>
            <img
              src={siteConfig?.coinIcon}
              alt=''
              className='h-[24px] w-[24px]'
            />
            <span className='text-[24px] font-[700] text-white'>
              {(accountInfo?.coins ?? 0) + (accountInfo?.bonus ?? 0)}
            </span>
          </div>
        </div>

        <div
          className='mt-[8px] flex items-center justify-between bg-[#222222] px-[16px] py-[12px]'
          onClick={() => {
            jumpToPage('history')
            setOpenUserInfoBubble(false)
            pageClickReport({
              _page_name: setReportPathName(pathname),
              _element_name: 'profile_history',
            })
          }}
        >
          <div className='flex items-center'>
            <i
              className='mr-[8px] inline-block h-[24px] w-[24px] bg-contain bg-no-repeat'
              style={{ backgroundImage: `url(${images.historyIcon})` }}
            ></i>
            {t('history.title')}
          </div>
          <i
            className='inline-block h-[16px] w-[16px] bg-contain bg-no-repeat'
            style={{ backgroundImage: `url(${images.iconEntry})` }}
          ></i>
        </div>

        <div>
          {userInfo.sid === LoginType.VISITOR ? (
            <Button
              className='mt-[16px] h-[48px] w-full rounded-[4px] text-[16px] text-white'
              onClick={() => {
                setOpenLoginModal(true, 'banner')
                setOpenUserInfoBubble(false)
              }}
            >
              {t('video.log-in')}
            </Button>
          ) : (
            <div
              className='flex cursor-pointer items-center justify-center gap-2 py-4 text-white/40 transition-colors hover:text-white/60'
              onClick={handleLogout}
            >
              <img
                src='https://v-mps.crazymaplestudios.com/images/0c156990-16a9-11f1-84ad-6b5693b490dc.png'
                className='h-5 w-5 opacity-40 transition-opacity hover:opacity-60'
                alt=''
              />
              <span className='text-[14px] font-[500]'>
                {t('video.log-out')}
              </span>
            </div>
          )}
        </div>
      </div>
    </CustomerDrawer>
  )
}

export default memo(UserStatus)
