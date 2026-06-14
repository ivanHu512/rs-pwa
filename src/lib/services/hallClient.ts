import { requestH5DramaSign } from '../request'
import { BookShelfPageV4Response, HallInfoV4Response } from '@/types/hall'

/**
 * getBookShelfPageV4
 */
export const getBookShelfPageV4 = async (
  bsId: number,
  page: number,
  _locale: string
) => {
  const res: any = await requestH5DramaSign(`/api/ms/h5hall/bookShelfPageV4`, {
    bs_id: bsId,
    page,
  })

  if (res && res.code === 0) {
    return res.data as BookShelfPageV4Response
  }
  return null
}

/**
 * getBookShelfPageV4
 */
export const getHallInfoV4 = async (options?: { signal?: AbortSignal }) => {
  const res: any = await requestH5DramaSign(`/api/ms/h5hall/infoV4`, {}, options)

  if (res && res.code === 0) {
    return res.data as HallInfoV4Response
  }
  return null
}