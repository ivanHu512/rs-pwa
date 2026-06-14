'use client'
import { getSiteConfigClient } from '@/lib/config/site'
import Image from 'next/image'
import { images } from '@/assets/images'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { LoginType, UserInfo } from '@/types/drama'
import { useTranslations } from 'next-intl'
import { getThirdSubInfo } from '@/lib/services/checkout'
import dayjs from 'dayjs'
import { localKeyUser } from '@/lib/constant'

const subType: any = {
  1: '',
  2: 'week',
  3: 'year',
  4: 'month',
  11: 'week',
  12: 'month',
  13: 'year',
}

const iconMap: Partial<Record<LoginType, string>> = {
  [LoginType.FB]: images.facebookIcon,
  [LoginType.APPLE]: images.appleIcon,
  [LoginType.TT]: images.ttIcon,
  [LoginType.GG]: images.ggIcon,
}
export default function SubscriptionPage() {
  const [isMounted, setIsMounted] = useState(false)
  const t = useTranslations()
  const router = useRouter()
  const [plan, setPlan] = useState<any>(null)

  const siteConfig = getSiteConfigClient()
  const [userInfo, setUserInfo] = useState<UserInfo>({})

  useEffect(() => {
    setIsMounted(true)
    const localUser = localStorage.getItem(localKeyUser)
    if (localUser) {
      setUserInfo(JSON.parse(localUser))
    } else {
      setUserInfo({ sid: 0 })
    }
  }, [])

  useEffect(() => {
    // 游客不算登录
    const notSign =
      userInfo.sid !== undefined && userInfo.sid === LoginType.VISITOR
    console.log({ notSign, userInfo })
    if (notSign) {
      const url = window.location.href
      router.push(`/login?from=${encodeURIComponent(url)}`)
    }
  }, [userInfo])

  /** 获取登录类型的icon */
  const loginIcon = useMemo(() => {
    return iconMap[userInfo?.sid || LoginType.VISITOR]
  }, [userInfo.sid])

  useEffect(() => {
    getThirdSubInfo().then((res: any) => {
      const { code, data } = res
      // 不是正常备选结算订阅
      if (code !== 0 || data.status !== 0) {
        return
      }
      if (data.sub_status !== 1) {
        return
      }
      const date_type = subType[data.sub_type]

      setPlan({
        title: data.VIpSkuDetail.vip_sub,
        save: `${data.total_saving}`,
        price: `$${data.amount}/${date_type}`,
        amount: `$${data.amount}`,
        vip_expire_time: dayjs
          .unix(data.vip_expire_time)
          .format('MMMM D, YYYY'),
        hasDiscount: data.promotion_amount ? true : false,
        dis_price: `$${data.promotion_amount}/${date_type}`,
        order_id: data.order_id,

        promotion_text: data.promotion_text,
        sub_status: data.sub_status,
        start_date: `Starting from ${dayjs
          .unix(data.restore_price_time)
          .format('MMMM D')}`,
        is_auto_renewing: data.is_auto_renewing,
        tips: data.tips,
      })
    })
  }, [])

  return (
    <div className='mx-auto max-w-xl'>
      <div className='flex h-[40px] items-center justify-center'>
        {isMounted && siteConfig && (
          <Image
            alt={siteConfig.title}
            unoptimized
            width={127}
            height={24}
            src={siteConfig.headerLogo || ''}
          />
        )}
      </div>

      <div className='p-4'>
        {/** 用户信息 */}
        <div className='flex rounded-[4px] bg-[#141414] p-[14px]'>
          <div className='mr-[12px] h-[56px] w-[56px]'>
            <img
              src={userInfo?.pic || images.defaultActor}
              className='rounded-full object-cover'
              alt=''
              onError={(e) => {
                e.currentTarget.src = images.defaultActor
              }}
            />
          </div>
          <div className='flex flex-col justify-center space-y-[4px]'>
            <div className='text-[20px] font-[500]'>
              {userInfo.uname || 'Guest'}
            </div>
            <div className='flex items-center'>
              {loginIcon && (
                <img
                  className='mr-[4px] h-[15px] w-[15px]'
                  src={loginIcon}
                  alt=''
                />
              )}
              <div className='text-[13px] text-white/50'>
                UID:{userInfo?.uid}
              </div>
            </div>
          </div>
        </div>
        {/* 订单信息 */}
        {/* you plan */}
        <div className='mt-[24px]'>
          <h2 className='mb-[16px] text-[16px] font-bold'>You plan</h2>

          <div className='overflow-hidden rounded-[4px] bg-[#141414]'>
            {plan?.is_auto_renewing === 2 && (
              <div className='flex h-[36px] w-full items-center justify-center bg-[#292929] text-[14px]'>
                Subscription Cancelled
              </div>
            )}
            {!plan && (
              <div className='flex min-h-[214px] w-full items-center justify-center text-white/50'>
                No subscription yet
              </div>
            )}
            {plan && (
              <div className='w-full p-[16px]'>
                <div className='border-b border-white/10 pb-[16px]'>
                  <div className='flex space-x-[8px]'>
                    <div className='flex h-[24px] w-[24px] items-center justify-center'>
                      <Image
                        src={siteConfig?.vipIcon || ''}
                        alt=''
                        unoptimized
                        priority
                        width={48}
                        height={48}
                      />
                    </div>
                    <div className='text-[16px] font-bold'>{plan.title}</div>
                  </div>
                  {plan.save && (
                    <div className='mt-[4px] text-[12px]'>
                      Total savings:{' '}
                      <span className='text-[#FFB629]'>{plan.save}</span>
                    </div>
                  )}
                </div>
                <div className='flex border-b border-white/10 py-[16px]'>
                  {plan.hasDiscount && (
                    <div className='relative mr-[12px] flex w-[6px] justify-center pt-[4px]'>
                      <div className='absolute left-0 top-[4px] h-[6px] w-[6px] rounded-full bg-[#898989]'></div>
                      <div className='h-[60px] w-[1px] bg-[#292929]'></div>
                      <div className='absolute left-0 top-[60px] h-[6px] w-[6px] rounded-full bg-[#292929]'></div>
                    </div>
                  )}
                  <div className='flex flex-col'>
                    <div className={`${plan.hasDiscount ? 'h-[55px]' : ''}`}>
                      <div className='text-[12px] text-white/50'>
                        {plan.hasDiscount ? plan.promotion_text : 'Price'}
                      </div>
                      <div className='text-[16px]'>
                        {plan.hasDiscount ? plan.dis_price : plan.price}
                      </div>
                    </div>
                    {plan.hasDiscount && (
                      <div>
                        <div className='text-[12px] text-white/50'>
                          {plan.start_date}
                        </div>
                        <div className='text-[16px]'>{plan.price}</div>
                      </div>
                    )}
                  </div>
                </div>
                <div className='pt-[16px]'>
                  <div className='text-[12px] text-white/50'>
                    Automatic renewal on:
                  </div>
                  <div className='text-[16px]'>{plan.vip_expire_time}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
