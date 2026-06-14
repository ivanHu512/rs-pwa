import { NextRequest, NextResponse } from 'next/server'
import { getSiteConfigByHostname } from '@/lib/config/site'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const host = request.headers.get('host') || ''
    const hostname = host.split(':')[0]
    const config = getSiteConfigByHostname(hostname)

    const pathParam = url.searchParams.get('path')
    const startUrl = pathParam || '/'

    const manifest = {
      name: config?.title,
      short_name: config?.title,
      scope: '/',
      start_url: startUrl,
      display: 'standalone',
      theme_color: '#000000',
      background_color: '#000000',
      description: config?.description,
      icons: [
        {
          src: config?.appleTouchIcon?.[192] || config?.favicon,
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable',
        },
        {
          src: config?.appleTouchIcon?.[512] || config?.favicon,
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable',
        },
      ],
    }

    return NextResponse.json(manifest, {
      headers: {
        'Content-Type': 'application/manifest+json',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch (error) {
    console.error('Error generating manifest:', error)
    // 兜底返回，即使报错也返回一个基础结构以便 PWA 校验
    return NextResponse.json(
      {
        name: 'ReelShort',
        short_name: 'ReelShort',
        scope: '/',
        start_url: '/',
        display: 'standalone',
      },
      {
        headers: {
          'Content-Type': 'application/manifest+json',
        },
        status: 200,
      }
    )
  }
}
