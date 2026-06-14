'use client'

import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

import {
  AUTH_REDIRECT_URI,
  FB_REDIRECT_URI_PARAMS,
  getCookie,
} from '@/lib/cookies'
import { setSessionStorage } from '@/lib/storageUtils'

export default function AuthCallbackClient() {
  const navigate = useNavigate()

  useEffect(() => {
    // �?cookie 获取重定�?URI（客户端读取�?
    const redirectUri = getCookie(AUTH_REDIRECT_URI)
    const qs = getCookie(FB_REDIRECT_URI_PARAMS)

    if (redirectUri) {
      // 读取 hash 参数
      const hash = window.location.hash.substring(1)

      if (hash) {
        // 解码 redirectUri（因�?cookie 中可能被编码了）
        const decodedRedirectUri = decodeURIComponent(redirectUri)
        /** 避免replace丢失hash参数 */
        const params = new URLSearchParams(hash)
        const accessToken = params.get('access_token')
        setSessionStorage('fb_token', accessToken)

        // 构建最终的 URL：保�?hash 参数作为 hash fragment
        // 格式：https://example.com/page#access_token=...&expires_in=...
        const finalUrl = `${decodedRedirectUri}#${hash}`

        console.log('重定�?URL (保持 hash):', finalUrl)

        // 清除 cookie
        document.cookie =
          'auth_redirect_uri=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'

        // 重定向（hash 会保持为 hash fragment�?
        navigate(finalUrl, { replace: true })
      } else {
        // 解码 redirectUri（因�?cookie 中可能被编码了）
        const decodedRedirectUri = decodeURIComponent(redirectUri)
        // 没有 hash，直接重定向
        navigate(decodedRedirectUri, { replace: true })
      }
    }
  }, [navigate])

  return <div></div>
}
