import Image from 'next/image'

import LoginButton from '@/components/login-page/login-button'
import { getSiteConfig } from '@/lib/config/site-server'
import { cn } from '@/lib/utils'

export default async function LoginPage() {
  const siteConfig = await getSiteConfig()

  return (
    <div
      className={cn(
        'fixed h-full w-full overflow-hidden',
        'bg-[url(https://v-mps.crazymaplestudios.com/images/79280fa0-03c3-11f0-a38f-0d66b56fc320.jpg)] bg-cover bg-top bg-no-repeat text-white',
        'left-1/2 max-w-xl -translate-x-1/2'
      )}
    >
      <div
        className='absolute left-0 top-0 z-0 hidden h-full w-full'
        style={{
          background:
            'linear-gradient(238deg, rgba(129, 0, 0, 0.80) 0%, rgba(62, 9, 9, 0.25) 21.31%, rgba(0, 0, 0, 0.00) 64.19%)',
        }}
      ></div>
      <div className='relative z-[1] flex h-full flex-col'>
        <div className='main mt-[72px] flex flex-grow flex-col items-center'>
          <div className='logo mb-[24px] h-[80px] w-[80px] overflow-hidden rounded-2xl'>
            <Image
              src={siteConfig.appleTouchIcon?.[180] || ''}
              alt='ReelShort logo'
              unoptimized
              width={180}
              height={180}
              priority
            />
          </div>
          <h1>
            <Image
              src={siteConfig.siteNameIcon || ''}
              alt={siteConfig.title}
              className='h-[20px] w-auto'
              unoptimized
              width={0}
              height={20}
              priority
            />
          </h1>
          <p className='mt-2 text-[14px] text-white/70'>
            Login to check subscription records
          </p>
        </div>

        <div className='px-4'>
          {/* social-buttons */}
          <LoginButton />

          {/* terms */}
          <div className='mt-[36px] pb-[16px] text-center text-[12px] text-white/50'>
            If you continue, you agree to the{' '}
            <a
              key='user-agreement'
              className='text-[#6EA2F8]'
              target='_blank'
              href={siteConfig.userAgreement || '/user-agreement.html'}
            >
              Terms and Service
            </a>{' '}
            & <br />
            <a
              key='privacy-policy'
              className='text-[#6EA2F8]'
              target='_blank'
              href={siteConfig.privacyAgreement || '/privacy-agreement.html'}
            >
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
