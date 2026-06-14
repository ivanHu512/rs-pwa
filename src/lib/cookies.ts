export const AUTH_REDIRECT_URI = 'auth_redirect_uri'
export const FB_REDIRECT_URI_PARAMS = 'fb_redirect_uri_params'
export const LOGIN_POSITION = 'login_position'

export const COOKIE_KEY_UID = 'uid'
export const COOKIE_KEY_DEVID = 'devId'

export function cookieSet(cname: string, cvalue: string, exdays?: number) {
  let expires = ''
  if (exdays) {
    const d: any = new Date()
    d.setTime(d.getTime() + exdays * 24 * 60 * 60 * 1000)
    expires = 'expires=' + d.toGMTString()
  }

  // 添加 path=/ 确保整个域名下都可以访问
  document.cookie = `${cname}=${escape(cvalue)}; ${expires}${expires ? '; ' : ''}path=/`
}

export function cookieRemove(cname: string) {
  cookieSet(cname, '', -1)
}

export const getCookie = (name: string) => {
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) return parts.pop()?.split(';').shift()
  return null
}
