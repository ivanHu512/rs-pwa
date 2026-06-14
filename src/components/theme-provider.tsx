'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import * as React from 'react'
import { getSiteConfigClient } from '@/lib/config/site'

function SiteConfigHydrator() {
  const config = getSiteConfigClient()

  React.useLayoutEffect(() => {
    if (!config || typeof document === 'undefined') return

    // Apply dynamic theme color
    if (config.theme?.primary) {
      document.documentElement.style.setProperty(
        '--primary',
        config.theme.primary
      )
    }
    // Apply head tags for PWA and branding
    document.title = config.title
  }, [config])

  if (!config) return null

  return null
}

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return (
    <NextThemesProvider {...props}>
      <SiteConfigHydrator />
      {children}
    </NextThemesProvider>
  )
}
