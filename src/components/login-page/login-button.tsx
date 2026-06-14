'use client'
import { images } from '@/assets/images'
import Toast from '@/components/ui/toast'
import { useAppleLogin } from '@/hooks/login/use-apple'
import { useFacebookLogin } from '@/hooks/login/use-facebook'
import { useGgLogin } from '@/hooks/login/use-gg'
import { useUserInfo } from '@/hooks/use-user-info'
import { getSiteConfigClient } from '@/lib/config/site'
import { loginIn, serviceThirdLoginInfo } from '@/lib/services/login'
import { detectWebView, isUserVip } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import { useLoginStore } from '@/stores/login-store'
import { UserInfo } from '@/types/drama'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import Script from 'next/script'
import { useEffect, useRef, useState } from 'react'
import { useShallow } from 'zustand/shallow'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginButton() {
  const siteConfig = getSiteConfigClient()
  const loginDataInfo = useRef<any>(null)
  const userRef = useRef<UserInfo>({}) //
  const t = useTranslations()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loginList, setLoginList] = useState<
    { sid: 1 | 3 | 5; icon: string; alt: string }[]
  >(() => [
    { sid: 1, icon: images.appleIcon, alt: 'apple' },
    { sid: 5, icon: images.ttIcon, alt: 'tt' },
  ])

  const { setLoginUserInfo } = useLoginStore(
    useShallow((state) => ({
      setLoginUserInfo: state.setLoginUserInfo,
    }))
  )
  const { userInfo, setUserInfo } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
      setUserInfo: state.setUserInfo,
    }))
  )
  const { getUserInfo } = useUserInfo()

  /**
   * FB&gg登陆回调
   *  判断直接替换还是弹框用户选择
   */
  const facebookAndGgCallBackFn = (res: LoginModuleType.FbCallbackType) => {
    const currentUserInfo = userRef.current
    console.log('facebookCallBackFn==>', res, currentUserInfo)
    // if (
    //   (currentUserInfo?.account?.coins ?? 0) +
    //     (currentUserInfo?.account?.bonus ?? 0) >
    //     0 ||
    //   isUserVip(currentUserInfo?.account)
    // ) {
    //   // 获取第三方回来的用户信息作显示
    //   getThirdLoginUserInfo(res)
    // } else {
    //   requestLogin(res)
    // }
    requestLogin(res)
  }

  /**
   * gg登陆
   *  firebase
   */
  const { googleSignInWithPopup } = useGgLogin({
    callback: facebookAndGgCallBackFn,
  })

  /**
   * fb登陆
   *  firebase
   */
  const { facebookSignInWidthRedirect } = useFacebookLogin({
    callback: facebookAndGgCallBackFn,
  })

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
        Toast.show(t('login.login-suc'))
        redirectFrom()
      } else {
        Toast.show(t('login.login-fail'))
      }
    } catch (error) {
      Toast.show(t('login.login-fail'))
      console.warn(error)
    } finally {
    }
  }

  /** 获取第三方登录用户信息，判断是否弹框 */
  const getThirdLoginUserInfo = async (res: LoginModuleType.FbCallbackType) => {
    try {
      const params = {
        sid: res.sid,
        openid: res.openid,
      }
      const result = await serviceThirdLoginInfo(params)
      console.log({ result })
      if (result?.showPopup) {
        loginDataInfo.current = res
        setLoginUserInfo(result?.previous_account)
      } else {
        requestLogin(res)
      }
    } catch (error) {}
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
      redirectFrom()
    } else {
      // FB登陆回调登陆
      requestLogin(loginDataInfo.current)
    }
  }

  const redirectFrom = () => {
    const redirect = searchParams.get('from')
    router.push(redirect || '/')
  }

  /**
   * 苹果&TT登陆回调
   *  判断直接替换还是弹框用户选择
   */
  const appleAndTTCallBackFn = (res: any) => {
    loginDataInfo.current = res
    // if (
    //   ((userInfo?.account?.coins ?? 0) + (userInfo?.account?.bonus ?? 0) > 0 ||
    //     isUserVip(userInfo?.account)) &&
    //   userInfo?.uid !== res.data?.user_info?.uid
    // ) {
    //   setLoginUserInfo(res.data?.user_info)
    // } else {
    //   confirmLogin()
    // }
    confirmLogin()
  }

  const { handleAppleLogin, handleTikTokLogin } = useAppleLogin({
    callback: appleAndTTCallBackFn,
  })
  const handleClickLogin = (sid: 1 | 2 | 3 | 5) => {
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
    </>
  )
}
