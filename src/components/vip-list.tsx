'use client'
import { useTranslations } from 'next-intl'

import { Hd, ViewIcon, WhiteHD, WhiteViewIcon } from '@/components/ui/icons'
import { useCheckout } from '@/hooks/use-checkout'
import { getSiteConfigClient } from '@/lib/config/site'
import { cn } from '@/lib/utils'
export default function VipList(props: {
  list: any[]
  onClick: (item: any) => void
  itemInfo?: any
}) {
  const t = useTranslations()
  const { list, onClick, itemInfo } = props
  const { isMixPay } = useCheckout()

  const siteConfig = getSiteConfigClient()

  if (!list || list?.length === 0) {
    return null
  }

  return (
    <div className='mt-4'>
      <div className='text-base font-bold text-white/90'>
        {t('checkout.vip-tit')}
      </div>
      {/* <p className="text-xs text-white/50">Auto renew. Cancel anytime. </p> */}
      <div className='mt-3 flex flex-col gap-2'>
        {list.map((item: any, index: number) => {
          const {
            identifier,
            mark = '',
            discount_off,
            promotion_price,
            price,
            vip_subtitle,
            count_down,
            vip_type,
          } = item

          const _mark = mark.replace('-rateN-', discount_off)
          const _vip_subtitle = vip_subtitle
            .replace('-S_P-', `$${price}`)
            .replace('-F_P-', `$${promotion_price}`)
          const _price = identifier ? promotion_price : price

          const isSelected = itemInfo?.gid === item.gid && isMixPay

          return (
            <div
              key={index}
              onClick={() => {
                onClick(item)
              }}
              data-type={vip_type !== 1 ? 'other' : 'weekly'}
              className={cn(
                `group relative w-full overflow-hidden rounded-sm`,
                vip_type !== 1 ? 'bg-[#292929]' : '',
                isSelected &&
                  'ring-1 ring-white ring-offset-2 ring-offset-[#141414]'
              )}
              style={
                vip_type === 1 ? { background: siteConfig?.vipListBg } : {}
              }
            >
              {siteConfig?.vipBgMask && (
                <div
                  className='absolute right-0 top-0 z-0 h-[94px] w-[172px] bg-contain bg-no-repeat group-data-[type=other]:hidden'
                  style={{ backgroundImage: `url(${siteConfig?.vipBgMask})` }}
                ></div>
              )}
              {mark && (
                <div
                  className='absolute right-0 top-0 flex h-4 items-center justify-center gap-1 rounded-bl rounded-tr px-2 text-[10px]'
                  style={{ background: siteConfig?.discountBg }}
                >
                  <span>{_mark}</span>
                </div>
              )}
              <div className='z-1 relative box-content flex h-[40px] items-center p-4'>
                <div className='w-full'>
                  <div
                    className='text-base font-bold group-data-[type=other]:text-white/90'
                    style={
                      vip_type === 1 ? { color: siteConfig?.vipTextColor } : {}
                    }
                  >
                    {item.vip_sub}
                  </div>
                  <div
                    className='line-clamp-2 overflow-hidden text-[10px] leading-[normal] group-data-[type=other]:text-white/70'
                    style={
                      vip_type === 1 ? { color: siteConfig?.vipTextColor2 } : {}
                    }
                  >
                    {_vip_subtitle}
                  </div>
                </div>
                <div className='flex w-[30%] flex-col text-right'>
                  <div
                    className='text-sm font-medium text-amber-950 group-data-[type=other]:text-white/90'
                    style={
                      vip_type === 1 ? { color: siteConfig?.vipTextColor } : {}
                    }
                  >
                    ${_price}
                  </div>
                  {promotion_price && (
                    <div
                      className='text-[10px] font-normal text-amber-950/70 line-through group-data-[type=other]:text-white/70'
                      style={
                        vip_type === 1
                          ? { color: siteConfig?.vipTextColor2 }
                          : {}
                      }
                    >
                      ${price}
                    </div>
                  )}
                </div>
              </div>
              <div
                className='z-1 relative box-content grid grid-cols-2 items-center justify-center gap-[6px] px-4 py-2 text-[10px] font-medium leading-[normal] group-data-[type=other]:bg-white/5 group-data-[type=other]:text-white/90'
                style={
                  vip_type === 1
                    ? {
                        color:
                          siteConfig?.vipBottomTextColor ||
                          siteConfig?.vipTextColor,
                        backgroundColor: siteConfig?.vipBottomBgColor,
                      }
                    : {}
                }
              >
                <div className='flex w-full items-center'>
                  <div className='mr-[4px] w-[16px]'>
                    {vip_type === 1 ? (
                      <ViewIcon className='h-4 w-4' />
                    ) : (
                      <WhiteViewIcon className='h-4 w-4' />
                    )}
                  </div>
                  {t('checkout.unlimited-viewing')}
                </div>
                <div className='flex w-full items-center'>
                  <div className='mr-[4px] w-[16px]'>
                    {vip_type === 1 ? <Hd className='h-4 w-4' /> : <WhiteHD />}
                  </div>
                  {t('checkout.1080p-high-quality')}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
