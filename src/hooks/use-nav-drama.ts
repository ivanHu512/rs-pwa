import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { getConfigId, getH5mode, getH5Advertise } from '@/lib/utils'

/** 跳转hook */
export const useJumpDramaPage = () => {
  const router = useRouter()
  const locale = useLocale()
  /** 跳转详情页, 新增第三个参数语言字段，用于history页面跳转播放器，需要跟随书籍语言 */
  const toDramaPage = (
    book_id: string,
    shelf_id: number,
    customLocale?: string
  ) => {
    window.routerTime = Date.now()
    window.shelf_id = shelf_id
    router.push(genDramaUrl(book_id, customLocale || locale))
  }

  /** 跳转任意页面, 除开播放器页面 */
  const jumpToPage = (pageName?: string) => {
    window.routerTime = Date.now()
    router.push(genPageUrl(locale, pageName))
  }

  return {
    toDramaPage,
    jumpToPage,
  }
}

/**
 * 生成Drama详情链接
 * @param book_id 书籍ID
 * @param locale 语言
 * @returns 格式化的URL字符串
 */
export function genDramaUrl(book_id: string, locale?: string): string {
  const paramsString = genH5ParamsString()
  const route = `/${locale}/drama/${book_id}${paramsString ? `/?${paramsString}` : ''}`
  return route
}

export function genPageUrl(locale?: string, pageName?: string): string {
  const paramsString = genH5ParamsString()
  const route = `/${locale}/${pageName || ''}${paramsString ? `?${paramsString}` : ''}`
  return route
}

function genH5ParamsString(): string {
  const model = getH5mode()
  const configId = getConfigId() || ''
  const { pixel, mediaType } = getH5Advertise()
  const params = new URLSearchParams()
  if (model) params.set('h5mode', model)
  if (configId) params.set('configId', configId)
  if (pixel) params.set('pixel', pixel)
  if (mediaType) params.set('mediaType', mediaType)

  return params.toString()
}
