import { env } from '@/lib/env'
import { RawBookDetailResponse } from '@/types/drama'

import { createServerH5PageRequestParams } from './index'

/**
 * 书籍详情
 */
export const getH5BookDetail = async ({
  bookId,
  locale,
  channelId,
  userAgent,
}: {
  bookId: string
  locale: string
  channelId?: string
  userAgent?: string
}) => {
  const API = `${env.API_DOMAIN}/api/video/book/getH5BookDetail`
  const res = await createServerH5PageRequestParams<{
    code: number
    data: RawBookDetailResponse
  }>(
    API,
    {
      book_id: bookId,
    },
    locale,
    channelId,
    userAgent
  )
  if (res.code == 0) {
    return res.data
  } else {
    return null
  }
}
