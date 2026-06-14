import { HistoryRequest, HistoryResponse } from '@/types/history'
import { requestH5DramaSign } from '../request'

type H5HistoryApiResponse = {
  code: number
  data: HistoryResponse
  msg?: string
}

/**
 * 获取历史记录
 * @param page_size
 * @param offset
 * @returns
 */
export const getH5History = async (
  params: HistoryRequest = {}
): Promise<HistoryResponse | null> => {
  const res = await requestH5DramaSign<H5HistoryApiResponse>(
    '/api/video/book/h5History',
    {
      page_size: params.page_size,
      offset: params.offset,
    }
  )
  if (res?.code === 0) {
    return res.data
  }
  return null
}
