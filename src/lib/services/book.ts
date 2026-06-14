import { getConfigId, getH5mode } from '@/lib/utils'
import {
  ChapterDetailRequestParams,
  ChapterDetailResponse,
  RawBookDetailResponse,
  RawChapterContentResponse,
  RawChapterListResponse,
} from '@/types/drama'

import { requestH5DramaSign } from '../request'
/**
 * 章节详情
 */
export const getChapterInfo = async ({
  bookId,
  chapterId,
}: ChapterDetailRequestParams) => {
  const res: any = await requestH5DramaSign<{
    code: number
    data: ChapterDetailResponse
  }>('/api/comic/getChapterContent', {
    book_id: bookId,
    chapter_id: chapterId,
  })
  if (res?.code == 0) {
    return res?.data
  } else {
    return null
  }
}

/**
 * 获取章节列表
 * @param bookId
 * @returns
 */
export const getChapterList = async (bookId: string = '') => {
  const res: any = await requestH5DramaSign<{
    code: number
    data: RawChapterListResponse
  }>('/api/video/book/getChapterList', {
    book_id: bookId,
    h5mode: getH5mode() || '',
    configId: getConfigId() || '',
  })
  if (res?.code == 0) {
    return res?.data
  } else {
    return null
  }
}

/**
 * 书籍详情
 * @param bookId
 */
export const getBookDetail = async (bookId: string = '') => {
  const res: any = await requestH5DramaSign<{
    code: number
    data: RawBookDetailResponse
  }>('/api/video/book/getBookDetail', {
    book_id: bookId,
  })
  if (res?.code == 0) {
    return res?.data
  } else {
    return null
  }
}

/**
 * 获取章节内容
 * @param book_id
 * @returns
 */
export const getChapterContent = async (
  {
    bookId,
    chapterId,
  }: {
    bookId: string
    chapterId: string
  },
  options?: { signal?: AbortSignal }
) => {
  const res: any = await requestH5DramaSign<{
    code: number
    data: RawChapterContentResponse
  }>(
    '/api/video/book/getH5VideoChapterContent',
    {
      book_id: bookId,
      chapter_id: chapterId,
      h5mode: getH5mode() || '',
      configId: getConfigId() || '',
    },
    options
  )
  if (res?.code == 0) {
    return res?.data
  } else {
    return null
  }
}

/**
 * 上报播放进度
 * @param book_id
 * @param read_record
 * @returns
 */
export const uploadHeartBeat = async ({
  bookId,
  readRecord,
}: {
  bookId: string
  readRecord: string
}) => {
  const res: any = await requestH5DramaSign<{
    code: number
    data: unknown
  }>('/api/video/book/heartBeat', {
    book_id: bookId,
    read_record: readRecord,
  })
  if (res?.code == 0) {
    return res?.data
  } else {
    return null
  }
}

/**
 * h5短剧投放链接上报
 * @param url
 * @returns
 */
export const uploadH5VideoUrlReport = async (url: string) => {
  const res: any = await requestH5DramaSign<{
    code: number
    data: unknown
  }>('/api/video/book/h5VideoUrlReport', {
    url,
  })
  if (res?.code == 0) {
    return res?.data
  } else {
    return null
  }
}
