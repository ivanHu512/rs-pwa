'use client'

import { useTranslations } from 'next-intl'
import { useInViewport } from 'ahooks'
import Image from 'next/image'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { images } from '@/assets/images'
import { useReport } from '@/hooks/use-report'
import { getBookShelfPageV4 } from '@/lib/services/hallClient'
import { BookItemType, BookShelfItemType } from '@/types/hall'
import { useLocale } from 'next-intl'

import BookItem from './book-item'

//  先分割成两列
function splitArray(
  data: BookItemType[]
): null | [BookItemType[], BookItemType[], BookItemType[]] {
  // 如果输入数据为空或不是数组，返回null
  if (!data || !Array.isArray(data) || data.length === 0) {
    return null
  }

  const arr1 = []
  const arr2 = []
  const arr3 = []

  for (let i = 0; i < data.length; i++) {
    // 根据索引除以3的余数分配到不同的数组
    if (i % 3 === 0) {
      arr1.push(data[i])
    } else if (i % 3 === 1) {
      arr2.push(data[i])
    } else {
      arr3.push(data[i])
    }
  }

  return [arr1, arr2, arr3]
}

const Popular = (props: BookShelfItemType) => {
  const t = useTranslations()
  // const pageSize = 9;
  // 创建哨兵元素的引用
  const sentinelRef = useRef<HTMLDivElement>(null)
  // 使用 useInViewport 监听哨兵元素
  const [inViewport] = useInViewport(sentinelRef, {
    rootMargin: '200px 0px', // 在元素进入视口前 200px 就开始加载
    threshold: 0.01, // 只要有一个像素可见就触发
  })

  const { userHallBookReport } = useReport()

  const { books, bs_id, is_finished } = props

  const [list, setList] = useState<BookItemType[]>(books || [])
  const [page, setPage] = useState(0) // Start from 0, first pagination call will be page 1
  const [hasMore, setHasMore] = useState(
    is_finished === 0 || is_finished === undefined
  )
  const [loading, setLoading] = useState(false)
  const locale = useLocale()

  const chunkList = useMemo(() => {
    return splitArray(list)
  }, [list])
  /** 拉取更多数据 */
  const fetchMoreData = useCallback(
    (page: number) => {
      setLoading(true)
      getBookShelfPageV4(bs_id, page, locale)
        .then((res) => {
          if (res) {
            const { lists: newBooks, is_finished } = res
            if (newBooks.length) {
              const newList = [...list, ...newBooks]
              setList(newList)
              setPage(page)
            }
            setHasMore(is_finished === 0 || is_finished === undefined)
            if (newBooks.length) {
              const prePos = list.length
              userHallBookReport({
                _page_name: 'home',
                item_list: newBooks.map(
                  (c: BookItemType, i: number) =>
                    `${prePos + i}#${c.book_id}#${bs_id}#1`
                ), // story_rank#story_id#shelf_id&shelf_rank
              })
            }
          }
        })
        .catch((error) => {
          console.error('fetchMoreData-error:', error)
          setHasMore(false)
        })
        .finally(() => {
          setLoading(false)
        })
    },
    [list, loading, page, hasMore]
  )

  useEffect(() => {
    // 防止重复加载，并且只在还有更多数据时加载
    if (inViewport && !loading && hasMore) {
      fetchMoreData(page + 1) // 传入当前页码发起请求
    }
  }, [inViewport, loading, hasMore, page])

  useEffect(() => {
    if (books && books.length) {
      userHallBookReport({
        _page_name: 'home',
        item_list: books.map(
          (c: BookItemType, i: number) => `${i}#${c.book_id}#${bs_id}#1`
        ), // story_rank#story_id#shelf_id&shelf_rank
      })
    }
  }, [books])

  return (
    <div>
      {chunkList && (
        <div className='grid grid-cols-3 gap-2'>
          {chunkList.map((col, _index) => {
            return (
              <div key={_index}>
                {col.map((item, __index) => {
                  return (
                    <BookItem
                      key={`${item.book_id}-${__index}`}
                      bs_id={bs_id}
                      data={item}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
      {/* 关键的“哨兵”元素，用于触发加载 */}
      <div ref={sentinelRef} className='h-1'></div>
      {loading ? (
        <div className='my-[16px] flex justify-center'>
          <Image
            src={images.hallBookLoadingIcon}
            alt='loading'
            width={24}
            height={24}
            unoptimized
          />
        </div>
      ) : null}
    </div>
  )
}

export default Popular
