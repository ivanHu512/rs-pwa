'use client'
import { useI18n } from '@/i18n'
import { useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { images } from '@/assets/images'
import CustomerDrawer from '@/components/drawer'
import { useReport } from '@/hooks/use-report'
import {
  getSiteConfigClient,
  siteButtonBgStyle,
  siteButtonOverlayStyle,
} from '@/lib/config/site'
import { cn, isUserVip } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import { useLoginStore } from '@/stores/login-store'
import { UserInfo } from '@/types/drama'

export default function LoginSelectPopup({
  confirmLogin,
}: {
  confirmLogin: (res: UserInfo) => void
}) {
  const { openSelectUserModal, setOpenSelectUserModal, loginUserInfo } =
    useLoginStore(
      useShallow((state) => ({
        openSelectUserModal: state.openSelectUserModal,
        setOpenSelectUserModal: state.setOpenSelectUserModal,
        loginUserInfo: state.loginUserInfo,
      }))
    )
  const { userInfo } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
    }))
  )
  const { userLoginInformationPopupReport } = useReport()
  const { t } = useI18n()
  const siteConfig = getSiteConfigClient()

  const [selectedUid, setSelectedUid] = useState<number | null>(null)

  useEffect(() => {
    if (userInfo) {
      setSelectedUid(userInfo.uid || null)
    }
  }, [userInfo])

  useEffect(() => {
    if (openSelectUserModal && loginUserInfo.uid) {
      userLoginInformationPopupReport({
        _action: 'show',
        previous_account: loginUserInfo.uid || 0,
      })
    }
  }, [openSelectUserModal, loginUserInfo.uid])

  const handleConfirmLogin = () => {
    setOpenSelectUserModal(false)
    const alwayCurrent = selectedUid === userInfo.uid
    userLoginInformationPopupReport({
      _action: alwayCurrent ? 'return_click' : 'continue_click',
      previous_account: loginUserInfo.uid || 0,
    })
    if (alwayCurrent) {
      return
    }
    confirmLogin(loginUserInfo)
  }

  return (
    <CustomerDrawer
      isOpen={openSelectUserModal}
      className='border-none'
      zIndex={60}
      dismissible={false}
    >
      <p className='mt-[1px] text-[16px] font-[700] text-[rgba(255,255,255,0.9)]'>
        {t('login.login-select-title')}
      </p>
      <p className='mb-[12px] mt-[8px] text-[14px] font-[400] text-[rgba(255,255,255,0.5)]'>
        {t('login.login-select-desc')}
      </p>
      {/* 登陆用户  */}
      <div
        className={cn(
          'relative mt-[12px] overflow-hidden rounded-[4px] border-[0.5px] border-solid bg-[#292929] p-[16px]',
          selectedUid === loginUserInfo?.uid
            ? 'border-[rgba(255,255,255,0.9)]'
            : 'border-transparent'
        )}
        onClick={() => setSelectedUid(loginUserInfo?.uid || null)}
      >
        <div className='absolute right-0 top-0 h-[16px] rounded-bl-[4px] bg-[rgba(255,255,255,0.1)] px-[8px] text-[10px] font-[500] leading-[16px] text-[rgba(255,255,255,0.5)]'>
          {t('login.login-select-previous-account')}
        </div>
        <img
          src={
            selectedUid === loginUserInfo?.uid
              ? images.selectedIcon
              : images.selectIcon
          }
          alt='cover'
          width={16}
          height={16}
          className='absolute right-[16px] top-[40px] h-[16px] w-[16px]'
        />
        <div className='flex'>
          <img
            src={loginUserInfo?.pic || images.defaultActor}
            alt='cover'
            width={40}
            height={40}
            className='h-[40px] w-[40px] rounded-[50%]'
          />
          <div className='ml-[8px] flex-1'>
            <p className='h-[22px] text-[16px] font-[400] leading-[22px] text-[rgba(255,255,255,0.9)]'>
              {loginUserInfo?.uname}
            </p>
            <p className='mt-[2px] h-[16px] text-[12px] font-[400] leading-[16px] text-[rgba(255,255,255,0.5)]'>
              UID: {loginUserInfo?.uid}
            </p>
          </div>
        </div>
        <div className='backface-hidden my-[12px] h-[1px] w-[100%] origin-top scale-y-50 bg-white/10'></div>
        <div className='flex'>
          <div className='mr-[8px] flex items-center'>
            <img
              src={siteConfig?.coinIcon || ''}
              alt='cover'
              width={16}
              height={16}
              className='mr-[4px] h-[16px] w-[16px]'
            />
            <p className='min-w-[100px] text-[14px] font-[400] text-[rgba(255,255,255,0.5)]'>
              {(loginUserInfo?.coins || 0) + (loginUserInfo?.bonus || 0)}
            </p>
          </div>
          {!!loginUserInfo?.account?.vip_sec && (
            <div className='mr-[8px] flex items-center'>
              <img
                src={siteConfig?.vipIcon || ''}
                alt='cover'
                width={16}
                height={16}
                className='mr-[4px] h-[16px] w-[16px]'
              />
              <p className='min-w-[100px] text-[14px] font-[400] text-[rgba(255,255,255,0.5)]'>
                {t('login.login-select-vip')}
              </p>
            </div>
          )}
        </div>
      </div>
      {/*  登陆用户 */}
      {/* 当前用户  */}
      <div
        className={cn(
          'relative mt-[12px] overflow-hidden rounded-[4px] border-[0.5px] border-solid bg-[#292929] p-[16px]',
          selectedUid === userInfo.uid
            ? 'border-[rgba(255,255,255,0.9)]'
            : 'border-transparent'
        )}
        onClick={() => setSelectedUid(userInfo.uid || null)}
      >
        <div className='absolute right-0 top-0 h-[16px] rounded-bl-[4px] bg-[rgba(255,255,255,0.1)] px-[8px] text-[10px] font-[500] leading-[16px] text-[rgba(255,255,255,0.5)]'>
          {t('login.login-select-current-account')}
        </div>
        <img
          src={
            selectedUid === userInfo.uid
              ? images.selectedIcon
              : images.selectIcon
          }
          alt='cover'
          width={16}
          height={16}
          className='absolute right-[16px] top-[40px] h-[16px] w-[16px]'
        />
        <div className='flex'>
          <img
            src={userInfo?.pic || images.defaultActor}
            alt='cover'
            width={40}
            height={40}
            className='h-[40px] w-[40px] rounded-[50%]'
          />
          <div className='ml-[8px] flex-1'>
            <p className='h-[22px] text-[16px] font-[400] leading-[22px] text-[rgba(255,255,255,0.9)]'>
              {userInfo?.uname}
            </p>
            <p className='mt-[2px] h-[16px] text-[12px] font-[400] leading-[16px] text-[rgba(255,255,255,0.5)]'>
              UID: {userInfo?.uid}
            </p>
          </div>
        </div>
        <div className='backface-hidden my-[12px] h-[1px] w-[100%] origin-top scale-y-50 bg-white/10'></div>
        <div className='flex'>
          <div className='mr-[8px] flex items-center'>
            <img
              src={getSiteConfigClient()?.coinIcon || ''}
              alt='cover'
              width={16}
              height={16}
              className='mr-[4px] h-[16px] w-[16px]'
            />
            <p className='min-w-[100px] text-[14px] font-[400] text-[rgba(255,255,255,0.5)]'>
              {(userInfo?.account?.coins || 0) +
                (userInfo?.account?.bonus || 0)}
            </p>
          </div>
          {isUserVip(userInfo?.account) && (
            <div className='mr-[8px] flex items-center'>
              <img
                src={getSiteConfigClient()?.vipIcon || ''}
                alt='cover'
                width={16}
                height={16}
                className='mr-[4px] h-[16px] w-[16px]'
              />
              <p className='min-w-[100px] text-[14px] font-[400] text-[rgba(255,255,255,0.5)]'>
                {t('login.login-select-vip')}
              </p>
            </div>
          )}
        </div>
      </div>
      {/* 当前用户  */}
      <div
        className='relative isolate mt-[24px] flex h-[48px] items-center justify-center overflow-hidden rounded-[4px]'
        style={siteButtonBgStyle(siteConfig?.buttonBg)}
        onClick={handleConfirmLogin}
      >
        <span
          aria-hidden
          className='pointer-events-none absolute inset-0 rounded-[inherit]'
          style={siteButtonOverlayStyle(siteConfig?.buttonOverlay)}
        />
        <p className='text-[rgba(255,255,255, 0.9)] relative z-[1] text-center text-[14px] font-[700]'>
          {t('login.login-select-confirm-login')}
        </p>
      </div>
    </CustomerDrawer>
  )
}
