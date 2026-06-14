'use client'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { useTranslations } from 'next-intl'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { images } from '@/assets/images'
import CustomerDrawer from '@/components/drawer'
import Toast from '@/components/ui/toast'
import { useAppleLogin } from '@/hooks/login/use-apple'
import { useFacebookLogin } from '@/hooks/login/use-facebook'
import { useGgLogin } from '@/hooks/login/use-gg'
import { useReport } from '@/hooks/use-report'
import { useUserInfo } from '@/hooks/use-user-info'
import { getSiteConfigClient } from '@/lib/config/site'
import { LoginBindType } from '@/lib/constant'
import { loginIn, serviceThirdLoginInfo } from '@/lib/services/login'
import { detectWebView, isUserVip } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import { useLoginStore } from '@/stores/login-store'
import { AccountInfo, UserInfo } from '@/types/drama'

import LoginSelectPopup from '../login-select-popup'

export default function ConditionalLoginPopup() {
  const pathname = usePathname()

  // 排除的路径列表，回调页面不添加登陆页面逻辑
  const excludedPaths = ['/auth-callback']

  // 判断是否应该加载
  const shouldLoad =
    pathname && !excludedPaths.some((path) => pathname.includes(path))

  if (!shouldLoad) {
    return null
  }

  return <LoginPopup />
}

export function LoginPopup() {
  /**
   * apple回调信息(rs登陆用户信息) ,直可以接替换当前用户信息   http://localhost:3002
   * fb回调信息(第三方登录用户信息)不同，需要调用接口获取用户信息或者登陆获取信息替换 https://localhost:3002
   *  */
  const loginDataInfo = useRef<any>(null)
  const t = useTranslations()
  const [loginList, setLoginList] = useState<
    { sid: 1 | 3 | 5; icon: string; alt: string }[]
  >(() => [
    { sid: 1, icon: images.appleIcon, alt: 'apple' },
    { sid: 5, icon: images.ttIcon, alt: 'tt' },
  ])

  const siteConfig = getSiteConfigClient()

  const {
    openLoginModal,
    setOpenLoginModal,
    setOpenSelectUserModal,
    setLoginUserInfo,
  } = useLoginStore(
    useShallow((state) => ({
      openLoginModal: state.openLoginModal,
      setOpenLoginModal: state.setOpenLoginModal,
      setOpenSelectUserModal: state.setOpenSelectUserModal,
      setLoginUserInfo: state.setLoginUserInfo,
    }))
  )
  const { userInfo, setUserInfo } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      setUserInfo: state.setUserInfo,
    }))
  )
  const { userLoginReport, userBindAccountReport, userLoginGuidePopupReport } =
    useReport()
  const { getUserInfo } = useUserInfo()
  const userRef = useRef<UserInfo>({}) // 解决回调函数中userinfo不是最新

  useEffect(() => {
    if (!detectWebView()) {
      setLoginList([
        { sid: 3, icon: images.ggIcon, alt: 'google' },
        ...loginList,
      ])
    }
  }, [])

  useEffect(() => {
    userRef.current = userInfo
  }, [userInfo])

  useEffect(() => {
    if (openLoginModal) {
      userLoginGuidePopupReport({
        _action: 'show',
      })
    }
  }, [openLoginModal])

  const handleClickLogin = (sid: 1 | 2 | 3 | 5) => {
    userBindAccountReport({
      _action: 'start',
      _app_account_bindtype: LoginBindType[sid],
    })
    userLoginGuidePopupReport({
      _action: 'guide_click',
    })
    if (sid === 1) {
      handleAppleLogin()
    } else if (sid === 2) {
      facebookSignInWidthRedirect()
    } else if (sid === 5) {
      handleTikTokLogin()
    } else if (sid === 3) {
      googleSignInWithPopup()
    }
  }

  /**
   * 苹果&TT登陆回调
   *  判断直接替换还是弹框用户选择
   */
  const appleAndTTCallBackFn = (res: any) => {
    loginDataInfo.current = res
    if (
      ((userInfo?.account?.coins ?? 0) + (userInfo?.account?.bonus ?? 0) > 0 ||
        isUserVip(userInfo?.account)) &&
      userInfo?.uid !== res.data?.user_info?.uid
    ) {
      setLoginUserInfo(res.data?.user_info)
      setOpenSelectUserModal(true)
    } else {
      confirmLogin()
    }
  }
  const { handleAppleLogin, handleTikTokLogin } = useAppleLogin({
    callback: appleAndTTCallBackFn,
  })
  /** 苹果登陆回调 **/

  /**
   * FB&gg登陆回调
   *  判断直接替换还是弹框用户选择
   */
  const facebookAndGgCallBackFn = (res: LoginModuleType.FbCallbackType) => {
    const currentUserInfo = userRef.current
    console.log('facebookCallBackFn==>', res, currentUserInfo)
    if (
      (currentUserInfo?.account?.coins ?? 0) +
        (currentUserInfo?.account?.bonus ?? 0) >
        0 ||
      isUserVip(currentUserInfo?.account)
    ) {
      // 获取第三方回来的用户信息作显示
      getThirdLoginUserInfo(res)
    } else {
      requestLogin(res)
    }
  }
  /**
   * fb登陆
   *  firebase
   */
  const { facebookSignInWidthRedirect } = useFacebookLogin({
    callback: facebookAndGgCallBackFn,
  })

  /**
   * gg登陆
   *  firebase
   */
  const { googleSignInWithPopup } = useGgLogin({
    callback: facebookAndGgCallBackFn,
  })

  /** 获取第三方登录用户信息，判断是否弹框 */
  const getThirdLoginUserInfo = async (res: LoginModuleType.FbCallbackType) => {
    try {
      const params = {
        sid: res.sid,
        openid: res.openid,
      }
      const result = await serviceThirdLoginInfo(params)
      if (result?.showPopup) {
        loginDataInfo.current = res
        setLoginUserInfo(result?.previous_account)
        setOpenSelectUserModal(true)
        setOpenLoginModal(false)
      } else {
        requestLogin(res)
      }
    } catch (error) {}
  }

  /** 执行登陆 */
  const requestLogin = async (params: any) => {
    try {
      const loginResult: any = await loginIn(params)
      if (loginResult?.user_info) {
        setUserInfo(
          {
            ...loginResult.user_info,
            subscribe_entrance: loginResult?.subscribe_entrance,
          },
          loginResult.session
        )
        reportLogin(loginResult.is_new_user, {
          ...loginResult.user_info,
          subscribe_entrance: loginResult?.subscribe_entrance,
        })
      } else {
        Toast.show(t('login.login-fail'))
      }
    } catch (error) {
      Toast.show(t('login.login-fail'))
      console.warn(error)
    } finally {
      setOpenLoginModal(false)
    }
  }

  /** 登陆成功 */
  const confirmLogin = () => {
    console.log('confirmLogin==>', loginDataInfo.current)
    if ([1, 5].includes(loginDataInfo.current?.data?.user_info?.sid)) {
      // 苹果登陆回调设置
      setUserInfo(
        {
          ...loginDataInfo.current?.data?.user_info,
          subscribe_entrance: loginDataInfo.current?.data?.subscribe_entrance,
        },
        loginDataInfo.current?.data?.session
      )
      getUserInfo(
        loginDataInfo.current?.data?.user_info?.uid,
        loginDataInfo.current?.data?.session
      )
      reportLogin(loginDataInfo.current?.data?.is_new_user, {
        ...loginDataInfo.current?.data?.user_info,
        subscribe_entrance: loginDataInfo.current?.data?.subscribe_entrance,
      })
    } else {
      // FB登陆回调登陆
      requestLogin(loginDataInfo.current)
    }
  }

  const reportLogin = (isNewUser: 0 | 1, user: UserInfo) => {
    Toast.show(
      isNewUser === 1 ? t('login.login-registration') : t('login.login-suc'),
      { duration: 3000 }
    )
    userLoginReport({
      eventName: isNewUser === 1 ? 'signup' : 'signin',
      other: {
        _app_account_bindtype: LoginBindType[user.sid || 0],
        _vc_stock: {
          vc_01: user.coins,
          vc_02: user.bonus,
        },
      },
    })
    userBindAccountReport({
      _action: 'complete',
      _app_account_bindtype: LoginBindType[user.sid || 0],
    })
  }
  return (
    <>
      {
        <>
          <Script
            src='https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
            onLoad={() => {
              window.AppleID.auth.init({
                clientId: siteConfig?.appleClientId,
                scope: 'email name',
                redirectURI: `${window.location.origin}/api/video/user/loginByApple`,
                state: 'DE',
              })
            }}
          />
          <Script
            src='https://connect.facebook.net/en_US/sdk.js'
            async
            defer
            onLoad={() => {
              // 初始化FB
              window.fbAsyncInit = function () {
                window.FB.init({
                  appId: siteConfig?.facebookAppId || '435852711476248',
                  cookie: true, // enable cookies to allow the server to access
                  // the session
                  xfbml: true, // parse social plugins on this page
                  version: 'v2.2', // use graph api version 2.8
                })
              }
            }}
          />
        </>
      }
      <CustomerDrawer
        isOpen={openLoginModal}
        onOpenChange={() => {
          Toast.show(t('login.login-cancel'))
          userLoginGuidePopupReport({
            _action: 'close',
          })
          setOpenLoginModal(false)
        }}
        className='border-none pt-8'
        zIndex={60}
      >
        <p className='text-center text-[18px] font-[700] text-[rgba(255,255,255,0.9)]'>
          {t('login.login-title')}
        </p>
        <p className='mt-[8px] text-center text-[14px] font-[400] text-[rgba(255,255,255,0.7)]'>
          {t('login.login-desc')}
        </p>
        <div
          className='relative mt-[32px] flex h-[48px] items-center justify-center rounded-[4px] bg-[#3E67B5]'
          onClick={() => handleClickLogin(2)}
        >
          <Image
            src={images.facebookIcon}
            alt='facebook'
            width={24}
            height={24}
            className='absolute left-4 top-1/2 -translate-y-1/2'
            unoptimized
          />
          <p className='text-center text-[16px] font-[500] text-[rgba(255,255,255)]'>
            {t('login.login-facebook')}
          </p>
        </div>
        <div className='mt-2 flex items-center justify-center gap-2'>
          {loginList.map((i) => (
            <div
              key={i.alt}
              className='flex h-[48px] flex-1 items-center justify-center rounded-[4px] bg-[#313131]'
              onClick={() => handleClickLogin(i.sid as any)}
            >
              <Image src={i.icon} alt='gg' width={24} height={24} unoptimized />
            </div>
          ))}
        </div>
        <div className='text-[rgba(255,255,255, 0.5)] mt-8 text-center text-[12px] font-[400]'>
          {t.rich('login.login-service-privacy', {
            linkOne: (chunks) => (
              <a
                className='text-[#6EA2F8]'
                href={siteConfig?.userAgreement || '/user-agreement.html'}
              >
                {chunks}
              </a>
            ),
            linkTwo: (chunks) => (
              <a
                className='text-[#6EA2F8]'
                href={siteConfig?.privacyAgreement || '/privacy-agreement.html'}
              >
                {chunks}
              </a>
            ),
          })}
        </div>
      </CustomerDrawer>
      <LoginSelectPopup confirmLogin={confirmLogin} />
    </>
  )
}
