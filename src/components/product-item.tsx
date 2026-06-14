'use client'
import Image from 'next/image'

import { cn } from '@/lib/utils'

import type { IProduct } from '@/types'
import { useCheckout } from '@/hooks/use-checkout'
import { getSiteConfigClient } from '@/lib/config/site'
export default function ProductItem({
  item,
  onClick,
  itemInfo,
}: {
  item: IProduct
  onClick?: (item: IProduct) => void
  itemInfo?: any
}) {
  const { coins = 0, bonus = 0, price = 0, mark } = item
  const isSelected = itemInfo?.gid === item.gid
  const { isMixPay } = useCheckout()
  const siteConfig = getSiteConfigClient()

  return (
    <div
      key={item.gid}
      className={cn(
        'relative h-[78px] w-full items-center justify-center rounded-[4px] bg-[#292929] p-4',
        isMixPay &&
          isSelected &&
          'ring-1 ring-white ring-offset-2 ring-offset-[#141414]'
      )}
      onClick={() => onClick?.(item)}
    >
      {mark ? (
        <div
          className='absolute right-0 top-0 flex h-4 items-center justify-center gap-1 rounded-bl rounded-tr px-2 text-[10px]'
          style={{ background: siteConfig?.discountBg }}
        >
          {mark}
        </div>
      ) : null}
      <div className='flex items-center text-base font-bold'>
        <Image
          src={siteConfig?.coinIcon || ''}
          alt=''
          width={16}
          height={16}
          className='mr-1 h-4 w-4'
          unoptimized
        />
        <span className='mr-1'>{coins}</span>
        {bonus ? <span className='text-white/50'>+{bonus}</span> : null}
      </div>
      <div className='mt-[2px] text-base text-white/50'>${price}</div>
    </div>
  )
}
