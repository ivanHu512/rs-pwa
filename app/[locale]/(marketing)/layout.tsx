// "use client";
import Common from '@/components/common'
import AuthProvider from '@/share/provider'

interface MarketingLayoutProps {
  children: React.ReactNode
}

export default async function MarketingLayout({
  children,
}: MarketingLayoutProps) {
  // const locale = await getLocale()
  // const lang = localsMap[locale] || 'en-US'
  // const adyenTranslations = `https://checkoutshopper-${process.env.NEXT_PUBLIC_ADYEN_ENV}.cdn.adyen.com/checkoutshopper/sdk/6.24.0/translations/${lang}.json`;

  return (
    <>
      <div className='flex min-h-screen flex-col'>
        {/* <link rel="prefetch" href={adyenTranslations} as="fetch" /> */}
        <main className='mx-auto w-full max-w-xl flex-1'>
          <AuthProvider>{children}</AuthProvider>
        </main>
        <Common />
      </div>
    </>
  )
}
