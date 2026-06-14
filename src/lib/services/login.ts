import { LoginParams, UserInfo } from '@/types/drama'

import { requestH5DramaSign } from '../request'
import { isJSON } from '../utils'
import { getH5mode } from '@/lib/utils'
interface IResponse {
  code: number
  data: {
    user_info: UserInfo
    session: string
  }
}
/**
 * 登陆
 * @returns
 */
export const loginIn = async (data: LoginParams) => {
  const res: any = await requestH5DramaSign<IResponse>(
    '/api/video/user/userLogin',
    {
      ...data,
      dev_model: 'h5',
      h5mode: getH5mode() || '',
    }
  )
  if (res.code == 0) {
    return res.data
  } else {
    return null
  }
}

/**获取用户信息 */
export const servicesGetUserInfo = (uid: number) => {
  return requestH5DramaSign<any>('/api/video/user/getUserInfo', {
    target_uid: uid,
  })
}

/** fb获取用户信息 */
export const servicesGetFbInfo = async (params: {
  fields: string
  access_token: string
}) => {
  // 构建查询字符串
  const queryParams = new URLSearchParams(params).toString()
  const url = `https://graph.facebook.com/v2.8/me?${queryParams}`
  const response = await fetch(url, {
    method: 'get',
    headers: {
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  const responseText = await response.text()

  if (isJSON(responseText)) {
    return JSON.parse(responseText)
  }
  return responseText
}

/**
 * 第三方登录获取用户信息
 * @param data
 * @returns
 */
export const serviceThirdLoginInfo = async (data: {
  sid: number //	登录类型o游客1苹果2FB3谷歌4邮箱（哲时没有/预留)5tiktok
  openid: string //	平台ID，登录相关
}) => {
  const res: any = await requestH5DramaSign('/api/video/user/thirdLoginPopup', {
    ...data,
  })
  if (res.code == 0) {
    return res.data
  } else {
    return null
  }
}
