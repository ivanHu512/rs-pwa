import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from 'firebase/auth'
import { useTranslations } from 'next-intl'
import { useCallback, useEffect } from 'react'

import Toast from '@/components/ui/toast'
import firebaseApp from '@/config/fireBaseConfig'

/**
 * FB登陆
 *  1. getLoginStatus已授权返回第三方信息之后回调callback
 *  2. getLoginStatus未授权，重定向登陆返回页面后取页面的hash参数获取access_token，然后调用fb信息获取第三方信息之后回调callback
 */

export function useGgLogin({ callback }: { callback: (res: any) => void }) {
  const t = useTranslations()

  useEffect(() => {
    const getGoogleRedirectResult = async () => {
      try {
        const auth = getAuth(firebaseApp)
        const result: any = await getRedirectResult(auth)
        console.log(
          '%c [ result ]-126',
          'font-size:13px; background:pink; color:#bf2c9f;',
          result
        )
        if (result) {
          const user = result.user
          const { photoURL, displayName, email } = user
          callback({
            openid: result?.user.providerData[0]?.uid,
            uname: displayName,
            sid: 3,
            email: email,
            pic: photoURL,
          })
        }
      } catch (error) {}
    }
    getGoogleRedirectResult()
  }, [])

  const googleSignInWithPopup = useCallback(async () => {
    const auth = getAuth(firebaseApp)
    const provider = new GoogleAuthProvider()
    try {
      const result = await signInWithPopup(auth, provider)
      console.log(
        '%c [ result ]-126',
        'font-size:13px; background:pink; color:#bf2c9f;',
        result
      )
      const user = result.user
      const { photoURL, displayName, email } = user
      callback({
        openid: result?.user.providerData[0]?.uid,
        uname: displayName,
        sid: 3,
        email: email,
        pic: photoURL,
      })
    } catch (error: any) {
      console.log(error)
      if (error?.message.includes('auth/popup-blocked')) {
        // 弹窗被拦截时自动降级为重定向
        await signInWithRedirect(auth, provider)
      }
      if (!error?.message.includes('auth/popup-closed-by-user')) {
        Toast.show(t('login.login-fail'))
      }
      /**
       * 用户主动取消授权弹框会触发 Firebase: Error (auth/popup-closed-by-user).
       * 用户主动取消授权弹框后再次点击会先走到catch 提示auth/cancelled-popup-request
       */
      if (
        ![
          'Firebase: Error (auth/cancelled-popup-request).',
          'Firebase: Error (auth/popup-closed-by-user).',
        ].includes(error?.message)
      ) {
        location.reload()
      }
    }
  }, [])

  return { googleSignInWithPopup }
}
