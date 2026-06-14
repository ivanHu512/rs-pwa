'use client'

import React from 'react'

import { images } from '@/assets/images'
import BasicsImage from '@/components/basics-image'
import { useJumpDramaPage } from '@/hooks/use-nav-drama'
import { getLikeNumber } from '@/lib/utils'
import { BookItemType } from '@/types/hall'
import { useReport } from '@/hooks/use-report'
import { aliOssLoader } from '@/lib/aliOssLoader'

type IProps = {
  data: BookItemType
  bs_id: number
}

const BookItem: React.FC<IProps> = React.memo((props) => {
  const { bs_id } = props
  const { book_pic, book_title, read_count, book_id } = props.data || {}

  const { toDramaPage } = useJumpDramaPage()
  const { playEvent } = useReport()

  const handlerItemClick = React.useCallback(
    (e: any) => {
      e.stopPropagation()
      playEvent({
        subEventName: 'cover_click',
        shelf_id: bs_id,
        t_book_id: book_id,
      })
      toDramaPage(book_id, bs_id)
    },
    [bs_id, book_id, playEvent, toDramaPage]
  )

  const loader = React.useCallback((params: any) => {
    return aliOssLoader({ ...params, width: 640 })
  }, [])

  return (
    <div className='relative mb-[16px] shrink-0'>
      <div
        onClick={handlerItemClick}
        className='absolute left-0 top-0 z-10 h-full w-full cursor-pointer'
      ></div>
      <div
        className='relative aspect-[640/853] w-full overflow-hidden rounded-[6px] bg-white bg-cover bg-center bg-no-repeat'
        style={{ backgroundImage: `url(${images.bookCoverIcon})` }}
      >
        <BasicsImage
          loader={loader}
          src={book_pic}
          alt={book_title}
          width={640}
          height={853}
          loading='lazy'
          className='h-full w-full object-cover object-center'
        />
        <div className='absolute bottom-0 left-0 h-[34px] w-full bg-gradient-to-t from-black to-transparent'></div>
        <div className='absolute bottom-[5px] right-[5px] flex h-[14px] items-center text-[10px] font-medium text-white'>
          <span
            className='mb-[2px] flex h-[11px] w-[11px] bg-contain bg-left bg-no-repeat'
            style={{ backgroundImage: `url(${images.countPlayIcon})` }}
          ></span>
          <span>{getLikeNumber(read_count)}</span>
        </div>
      </div>
      <div className='shrink-0'>
        <h3 className='mt-[8px] line-clamp-2 h-[42px] text-[14px] leading-[21px] text-white'>
          {book_title}
        </h3>
      </div>
    </div>
  )
})
BookItem.displayName = 'BookItem'
export default BookItem
