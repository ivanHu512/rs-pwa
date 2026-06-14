import React, { useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useShallow } from 'zustand/shallow'

import { useReport } from '@/hooks/use-report'
import {
  localKeyDevId,
  localKeyUid,
  localKeyUser,
  sessionKey,
} from '@/lib/constant'
import { loginIn } from '@/lib/services/login'
import { useDramaStore } from '@/stores/drama-store'
import { useUserInfo } from '@/hooks/use-user-info'
import { UserInfo } from '@/types/drama'
import { getLocalStorage, setLocalStorage } from '@/lib/storageUtils'
interface LoginResponse {
  user_info: UserInfo
  session: string
  [key: string]: any
}

interface AuthProviderProps {
  children?: React.ReactNode
}

declare global {
  interface Window {
    VConsole: new () => void
  }
}

const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
}): React.ReactNode => {
  const { setUserInfo, updateApiError } = useDramaStore(
    useShallow((state) => ({
      setUserInfo: state.setUserInfo,
      updateApiError: state.updateApiError,
    }))
  )
  const { userLoginReport } = useReport()
  const { getUserInfo } = useUserInfo()

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const url = new URL(window.location.href)
        const u = url.searchParams.get('u')
        const s = url.searchParams.get('s')
        const t = url.searchParams.get('t')
        const uid = getLocalStorage(localKeyUid) || u
        const userInfoStr = getLocalStorage(localKeyUser) || t
        const session = getLocalStorage(sessionKey) || s || ''
        if (uid && session) {
          // 初始设置
          const userInfo: UserInfo = userInfoStr && JSON.parse(userInfoStr)
          if (userInfo?.uid) {
            setUserInfo(userInfo, session)
          }
          // 调用详情接口覆盖
          getUserInfo(uid, session)
        } else touristsLogin()
      } catch (error) {
        console.error('认证检查过程中发生错误:', error)
      }
    }
    checkAuth()
  }, [setUserInfo])

  /** 执行游客登录 */
  const touristsLogin = async () => {
    try {
      // 执行游客登录
      let devId = getLocalStorage(localKeyDevId)
      if (!devId) {
        devId = uuidv4()
        setLocalStorage(localKeyDevId, devId)
      }
      const loginResult: LoginResponse | null = await loginIn({
        uname: '', //	用户名
        sid: 0, //	登录类型0游客1苹果2FB3谷歌
        openid: devId, //	平台ID，登录相关
        pic: '', //	头像地址
      })
      if (loginResult?.user_info) {
        setUserInfo(
          {
            ...loginResult.user_info,
            subscribe_entrance: loginResult?.subscribe_entrance,
          },
          loginResult.session
        )

        setTimeout(() => {
          userLoginReport({
            eventName: loginResult.is_new_user === 1 ? 'signup' : 'signin',
            other: {
              _app_account_bindtype: 'vistor',
              _vc_stock: {
                vc_01: loginResult.user_info.coins,
                vc_02: loginResult.user_info.bonus,
              },
            },
          })
        }, 1000)
      } else {
        console.warn('登录失败或返回数据格式不正确')
        updateApiError(true)
      }
    } catch (error) {
      updateApiError(true)
      console.warn(error)
    }
  }

  return <>{children}</>
}

export default AuthProvider
