import { reportSDK } from './report'
import {
  localKeyUid,
  localKeyUser,
  localKeyVipLocked,
  sessionKey,
  urlChapterIdKey,
  urlChapterSortKey,
} from './constant'
import { removeLocalStorage } from './storageUtils'

export const setReportPathName = (pathName: string) => {
  if (pathName.indexOf('/drama') > -1) {
    pathName = 'player'
  }
  if (pathName.indexOf('/checkout') > -1) {
    pathName = 'checkout'
  }
  if (pathName.indexOf('/drama/guide') > -1) {
    pathName = 'download_post'
  }
  if (pathName.indexOf('/history') > -1) {
    pathName = 'library_main'
  }
  if (
    pathName.indexOf('/hall') > -1 ||
    pathName === '/' ||
    pathName.match(/^\/[a-z]{2}$/)
  ) {
    pathName = 'home'
  }
  return pathName
}

export const reloadPage = (type: 1 | 2) => {
  if (typeof window === 'undefined') return
  const params = {
    event_name: 'm_custom_event',
    sub_event_name: 'logout_click',
    properties: {
      _action: 'logout',
      _scene_name: 'main_scene',
      _page_name: 'home',
      type,
    },
  }
  reportSDK.eventReport(params)
  setTimeout(() => {
    removeLocalStorage(localKeyUid)
    removeLocalStorage(localKeyUser)
    removeLocalStorage(sessionKey)
    // localStorage.removeItem(localKeyDevId)
    removeLocalStorage(localKeyVipLocked)
    const url = new URL(window.location.href)
    const params = new URLSearchParams(url.search)
    params.delete(urlChapterIdKey)
    params.delete(urlChapterSortKey)
    url.search = params.toString()
    window.location.href = url.toString()
  }, 1000)
}
