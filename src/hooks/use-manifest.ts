import { useCallback } from 'react'
import { localKeyUid, sessionKey, localKeyUser } from '@/lib/constant'
import { getH5mode, getConfigId, getH5Advertise } from '@/lib/utils'
import { getLocalStorage } from '@/lib/storageUtils'
/**
 * 通过 manifest 文件生成 link 标签。
 * 使用方式：
 * const createManifest = useManifest();
 * const cleanup = createManifest(); // 需要时手动调用，并拿到清理函数
 */
export function useManifest() {
  const createManifest = useCallback(() => {
    const existingLink = document.querySelector('link[rel="manifest"]')
    if (existingLink) {
      existingLink.remove()
    }

    const userInfoStr = getLocalStorage(localKeyUser)
    const uid = getLocalStorage(localKeyUid)
    const session = getLocalStorage(sessionKey)
    const model = getH5mode()
    const config = getConfigId()
    const { pixel, mediaType } = getH5Advertise()
    const link = document.createElement('link')
    link.rel = 'manifest'

    if (uid) {
      const params = new URLSearchParams()
      params.set('u', uid)
      if (session) params.set('s', session)
      if (model) params.set('h5mode', model)
      if (config) params.set('configId', config)
      if (pixel) params.set('pixel', pixel)
      if (mediaType) params.set('mediaType', mediaType)
      if (userInfoStr) {
        try {
          const info = JSON.parse(userInfoStr)
          delete info.subscribe_entrance
          params.set('t', JSON.stringify(info))
        } catch (error) {
          console.log(error)
        }
      }

      const path = `/?${params.toString()}`
      link.href = `/manifest?path=${encodeURIComponent(path)}`
    } else {
      link.href = `/manifest`
    }
    document.head.appendChild(link)
  }, [])

  const destroyManifest = () => {
    const linkToRemove = document.querySelector('link[rel="manifest"]')
    if (linkToRemove) {
      linkToRemove.remove()
    }
  }

  return {
    createManifest,
    destroyManifest,
  }
}

export default useManifest
