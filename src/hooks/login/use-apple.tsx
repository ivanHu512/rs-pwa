import { useEffect, useRef } from 'react'
import { useShallow } from 'zustand/shallow'

import Toast from '@/components/ui/toast'
import { CLIENT_VER } from '@/lib/constant'
import { getSiteConfigClient } from '@/lib/config/site'

import { removeQueryParam } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import { useI18n } from '@/i18n'
import { useLocation } from "react-router-dom";
/**
 * Apple 登陆， TT 登陆
 */
export function useAppleLogin({ callback }: { callback: (res: any) => void }) {
  const { t, locale } = useI18n();
  const pathname = useLocation().pathname;

  const { userInfo } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
    }))
  )

  const isFirstRef = useRef<boolean>(true)

  useEffect(() => {
    document.addEventListener('AppleIDSignInOnFailure', (event) => {
      console.log('登陆失败===>', event)
      Toast.show(t('login.login-fail'))
    })
  }, [])

  /**
   * Apple 登陆
   */
  const handleAppleLogin = () => {
    const params = {
      uid: userInfo.uid,
      redirect: window.location.href,
      Apiversion: '1.0.4',
      Clientver: CLIENT_VER,
      channelId: getSiteConfigClient()?.channelId,
      lang: locale || 'en',
    }
    console.log('handleAppleLogin===>', params)
    window.AppleID.auth.signIn({
      state: JSON.stringify(params),
    })
  }
  /**
   * TT 登陆
   * https://developers.tiktok.com/doc/login-kit-web/
   */
  const handleTikTokLogin = () => {
    const params = {
      uid: userInfo.uid,
      channelId: getSiteConfigClient()?.channelId, //渠道号
      clientVer: CLIENT_VER, //web端版本号
      redirect: encodeURIComponent(window.location.href),
      lang: locale || 'en',
    }
    // window.location.href = `https://dev-project-v-api.stardustworld.cn/api/video/user/tiktokAuth?state=${JSON.stringify(params)}`;
    window.location.href = `${window.location.origin}/api/video/user/tiktokAuth?state=${JSON.stringify(params)}`
  }

  // Apple登录落地参数判断
  useEffect(() => {
    const url = new URL(window.location.href)
    const appLoginData = url.searchParams.get('data')
    if (
      appLoginData &&
      ((userInfo?.uid && isFirstRef.current) || pathname === '/login')
    ) {
      isFirstRef.current = false
      let res
      try {
        res = JSON.parse(appLoginData)
      } catch (error) {
        console.log('登陆失败===>', error)
        Toast.show(t('login.login-fail'))
        return
      }
      // 清除地址栏参数
      removeQueryParam('data')
      if (res?.code !== 0 || !res.data?.user_info) {
        Toast.show(t('login.login-fail'))
        return
      }
      callback(res)
    }
  }, [userInfo, pathname])

  return { handleAppleLogin, handleTikTokLogin }
}
