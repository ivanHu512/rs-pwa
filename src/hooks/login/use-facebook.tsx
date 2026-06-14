import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

import Toast from '@/components/ui/toast'
import { getSiteConfigClient } from '@/lib/config/site'
import {
  AUTH_REDIRECT_URI,
  cookieSet,
  FB_REDIRECT_URI_PARAMS,
} from '@/lib/cookies'
import { servicesGetFbInfo } from '@/lib/services/login'
import { getSessionStorage, removeSessionStorage } from '@/lib/storageUtils'
import { removeQueryParam } from '@/lib/utils'

/** 获取哈希参数 */
export const getHashVars = () => {
  const hashVars: any = {}

  if (typeof window !== 'undefined' && window.location.hash.length > 1) {
    const hashParams = window.location.hash.substring(1).split('&')
    for (const param of hashParams) {
      const [key, value] = param.split('=')
      hashVars[decodeURIComponent(key)] = value ? decodeURIComponent(value) : ''
    }
  }

  return hashVars
}

/**
 * FB登陆
 *  1. getLoginStatus已授权返回第三方信息之后回调callback
 *  2. getLoginStatus未授权，重定向登陆返回页面后取页面的hash参数获取access_token，然后调用fb信息获取第三方信息之后回调callback
 */

export function useFacebookLogin({
  callback,
}: {
  callback: (res: any) => void
}) {
  const t = useTranslations()
  /** fb重定向登录（只用于移动端） */
  const facebookSignInWidthRedirect = () => {
    getFacebookStatus(() => {
      /** 重定向地址为开发者后台配置，并且是绝对地址，目前本地https://localhost:3002可以调试 */
      // let redirect_uri = "https://localhost:3002";
      let redirect_uri = `${window.location.origin}/auth-callback` // 线上固定回调地址
      /** 保存当前页面地址，和参数，重定向回来后继续当前页面 */
      const currentUrl = new URL(window.location.href)
      currentUrl.searchParams.set('drama_login', 'fb_login')
      cookieSet(AUTH_REDIRECT_URI, currentUrl.toString(), 365)
      const url = new URL(window.location.href)
      const qs = url.searchParams.toString()
      cookieSet(FB_REDIRECT_URI_PARAMS, qs, 365)

      // fb登录不能加参数
      redirect_uri = redirect_uri.replace(/\?.*/, '')
      console.log(
        '%c [ redirect_uri ]-99',
        'font-size:13px; background:pink; color:#bf2c9f;',
        redirect_uri
      )
      const siteConfig = getSiteConfigClient()
      const fb_login_url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${siteConfig?.facebookAppId || '435852711476248'}&redirect_uri=${redirect_uri}&response_type=token`
      location.href = fb_login_url
    })
  }

  const getFacebookStatus = (login: () => void) => {
    const FB = window.FB
    FB.getLoginStatus((response: any) => {
      console.log(
        '%c [ response ]-39',
        'font-size:13px; background:pink; color:#bf2c9f;',
        response
      )
      if (response && response.status == 'connected') {
        try {
          window.FB.api(
            '/me',
            {
              fields: 'id,name,email,picture',
            },
            (response: any) => {
              callback({
                email: response?.email,
                sid: 2,
                openid: response.id,
                uname: response?.name,
                pic: response.picture?.data?.url,
              })
            }
          )
        } catch (error) {
          Toast.show(t('login.login-fail'))
          console.error(error)
        }
      } else {
        login()
      }
    })
  }

  /** 重定向成功回调 */
  useEffect(() => {
    const token = getSessionStorage('fb_token') || ''
    const hasToken = location.hash?.includes('access_token') || token

    if (hasToken) {
      const { access_token } = getHashVars()
      getFbInfo(token || access_token)
    } else {
      const urlParams = new URLSearchParams(window.location.search)
      const dramaLogin = urlParams.get('drama_login')
      if (dramaLogin === 'fb_login') {
        Toast.show(t('login.login-fail'))
      }
    }
    // 清除地址栏参数
    removeQueryParam('drama_login')
    removeSessionStorage('fb_token')
  }, [])

  /** 获取FB用户信息 */
  const getFbInfo = async (access_token: string) => {
    try {
      console.log(
        '%c [ access_token ]-204',
        'font-size:13px; background:pink; color:#bf2c9f;',
        access_token
      )
      // 清除地址栏参数
      removeQueryParam('access_token')

      const data = await servicesGetFbInfo({
        access_token,
        fields: 'id,name,email,picture',
      })
      callback({
        email: data?.email,
        sid: 2,
        openid: data.id,
        uname: data?.uname || data?.name,
        pic: data.picture?.data?.url,
      })
    } catch (error) {
      Toast.show(t('login.login-fail'))
      console.warn(error)
    }
  }

  return { facebookSignInWidthRedirect }
}
