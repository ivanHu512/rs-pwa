import './globals.css'

import { GoogleAnalytics } from '@next/third-parties/google'
import { notFound } from 'next/navigation'
import Script from 'next/script'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getMessages, setRequestLocale } from 'next-intl/server'

import Loading from '@/components/loading'
import Pixel from '@/components/pixel'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import VConsolelog from '@/components/vconsolelog'
import { routing } from '@/i18n/routing'
import { getSiteConfig } from '@/lib/config/site-server'
import { cn } from '@/lib/utils'
import { getVideoPlayerVariant } from '@/lib/player-ab'
import PlayerVariantProvider from '@/components/provide'
// Note: RootLayout is a Server Component again to handle i18n and SEO correctly.
// Dynamic site configuration is handled inside nested Client Components.

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const config = await getSiteConfig()
  if (!hasLocale(routing.locales, locale)) {
    return notFound()
  }
  const playerVariant = getVideoPlayerVariant()
  console.log('随机播放器类型', playerVariant)
  // Enable static rendering for next-intl
  setRequestLocale(locale)

  // Fetch messages on the server to avoid MISSING_MESSAGE error in client components
  const messages = await getMessages()

  return (
    <html lang={locale} dir='ltr' suppressHydrationWarning>
      <head>
        <title>{config?.title}</title>
        <meta name='description' content={config?.description} />
        <meta name='robots' content='noindex,nofollow' />
        <link rel='icon' href={config?.favicon} />
        <link rel='shortcut icon' href={config?.favicon} />
        <link
          rel='apple-touch-icon'
          href={config?.appleTouchIcon?.[180] || config?.favicon}
        />
        <link
          rel='apple-touch-icon-precomposed'
          href={config?.appleTouchIcon?.[180] || config?.favicon}
        />
        <link
          rel='dns-prefetch'
          href='https://v-mps.crazymaplestudios.com'
        ></link>
        <link rel='preconnect' href='https://fonts.googleapis.com' />
        <link
          rel='preconnect'
          href='https://fonts.gstatic.com'
          crossOrigin='anonymous'
        />
        <link
          href='https://fonts.googleapis.com/css2?family=Noto+Sans:ital,wght@0,400;0,500;0,700;1,400;1,500;1,700&display=swap'
          rel='stylesheet'
        />
        <Script
          id='player'
          strategy='beforeInteractive'
          dangerouslySetInnerHTML={{
            __html: `window.variantPlayer=${JSON.stringify(playerVariant)}`,
          }}
        />
        <meta
          name='viewport'
          content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover'
        />
        <meta name='msapplication-TileColor' content='#000000' />
        {/* <!-- ios-PWA配置 --> */}
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='black' />
        <meta name='apple-mobile-web-app-title' content={config?.title} />
        <meta name='theme-color' content='#000000' />
        <style
          dangerouslySetInnerHTML={{
            __html: `
            :root {
              --primary: ${config?.theme?.primary};
              --button-bg: ${typeof config?.buttonBg === 'string' ? config?.buttonBg : config?.buttonBg?.background};
              --button-shadow: ${typeof config?.buttonBg !== 'string' ? config?.buttonBg?.boxShadow || 'none' : 'none'};
              --button-overlay-bg: ${config?.buttonOverlay?.background || 'none'};
              --button-overlay-blend: ${config?.buttonOverlay?.mixBlendMode || 'normal'};
              --button-overlay-opacity: ${config?.buttonOverlay?.opacity ?? 1};
            }
          `,
          }}
        />

        {config?.appleTouchIcon && (
          <>
            <link
              rel='apple-touch-icon'
              sizes='324x324'
              href={config.appleTouchIcon[324]}
            />
            <link
              rel='apple-touch-icon'
              sizes='220x220'
              href={config.appleTouchIcon[220]}
            />
            <link
              rel='apple-touch-icon'
              sizes='192x192'
              href={config.appleTouchIcon[192]}
            />
            <link
              rel='apple-touch-icon'
              sizes='180x180'
              href={config.appleTouchIcon[180]}
            />
            <link
              rel='apple-touch-icon'
              sizes='167x167'
              href={config.appleTouchIcon[167]}
            />
            <link
              rel='apple-touch-icon'
              sizes='120x120'
              href={config.appleTouchIcon[120]}
            />
          </>
        )}
      </head>

      <body className={cn('min-h-screen font-sans antialiased')}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute='class'
            defaultTheme='dark'
            enableSystem={false}
            disableTransitionOnChange
          >
            <PlayerVariantProvider playerVariant={playerVariant}>
              {children}
            </PlayerVariantProvider>
            <Loading />
            <Toaster
              position='top-center'
              toastOptions={{
                style: {
                  background: '#141414',
                },
              }}
            />
          </ThemeProvider>
          <GoogleAnalytics
            gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENTID || ''}
          />
          <Pixel />
          <Script
            id='globalThis'
            strategy='beforeInteractive'
            dangerouslySetInnerHTML={{
              __html: `!function(t){function e(){var e=this||self;e.globalThis=e,delete t.prototype._T_}"object"!=typeof globalThis&&(this?e():(t.defineProperty(t.prototype,"_T_",{configurable:!0,get:e}),_T_))}(Object);`,
            }}
          />
          <Script
            id='setLang'
            strategy='beforeInteractive'
            dangerouslySetInnerHTML={{
              __html: `
                try {
                  localStorage.setItem('language','${locale}'); window.language = '${locale}';
                } catch (e) {
                  const safeStorage = {
                    getItem: () => null,
                    setItem: () => {},
                    removeItem: () => {},
                  }
                  Object.defineProperty(window, 'localStorage', {
                    value: safeStorage,
                    writable: false,
                    configurable: true,
                  })
                  Object.defineProperty(window, 'sessionStorage', {
                    value: safeStorage,
                    writable: false,
                    configurable: true,
                  })
                }
              `,
            }}
          ></Script>

          <Script
            id='google-pay'
            strategy='afterInteractive'
            src='https://pay.google.com/gp/p/js/pay.js'
          ></Script>
          {/** 阿里播放器组件 */}
          <Script
            id='ali-player'
            strategy='beforeInteractive'
            src='https://g.alicdn.com/apsara-media-box/imp-web-player/2.37.7/aliplayer-min.js'
          ></Script>
          {/** 原生播放器组件hls插件，方便回滚 */}
          <Script
            id='hls'
            strategy='beforeInteractive'
            src='https://v-mps.crazymaplestudios.com/images/3284ef80-bfa4-11f0-84ad-6b5693b490dc.js'
          ></Script>
          <Script
            id='sw'
            strategy='afterInteractive'
            dangerouslySetInnerHTML={{
              __html: `if('serviceWorker' in navigator) {
                window.addEventListener('load', function () {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function (registration) {
                      console.log('SW registered: ', registration);
                    })
                    .catch(function (registrationError) {
                      console.log('SW registration failed: ', registrationError);
                    });
                });
              }`,
            }}
          ></Script>
        </NextIntlClientProvider>
        <VConsolelog />
      </body>
    </html>
  )
}
