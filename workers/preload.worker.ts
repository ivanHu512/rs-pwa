/// <reference lib="webworker" />
import { getTSFiles } from '@/lib/preload-shared'

type Options = {
  m3u8Url: string, 
  chapterId: string, 
  id: string
}

type IncomingMessage = {
  type: 'preload'
  payload: {
    options: Options
    count?: number
  }
}

const preloadSegments = async (options: Options, count?: number) => {
  const tsFiles = await getTSFiles(options)
  const targetList =
    typeof count === 'number' ? tsFiles.slice(0, Math.max(count, 0)) : tsFiles
  const headers: any = {};
  await Promise.all(
    targetList.map(async (segmentUrl) => {
      try {
        const response = await fetch(segmentUrl, { cache: 'force-cache' })
        response.headers.forEach((value, key) => {
          headers[key] = value;
        });
      } catch (error) {
        console.warn('Segment preload failed:', segmentUrl, error)
      }
    })
  )
  return {
    length: targetList.length,
    ...options,
    cdn_server: headers["x-cdn-prov"]
  }
}

self.addEventListener('message', async (event: MessageEvent<IncomingMessage>) => {
  const { type, payload } = event.data || {}

  if (type !== 'preload' || !payload?.options?.m3u8Url) {
    return
  }

  try {
    const fetched = await preloadSegments(payload?.options, payload.count)

    self.postMessage({
      type: 'done',
      payload: {
        m3u8Url: payload?.options?.m3u8Url,
        fetched,
      },
    })
  } catch (error) {
    self.postMessage({
      type: 'error',
      payload: {
        m3u8Url: payload?.options?.m3u8Url,
        error: error instanceof Error ? error.message : 'Unknown worker error',
      },
    })
  }
})

export {}


