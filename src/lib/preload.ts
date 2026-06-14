import { reportSDK } from "@/lib/report";

import { getTSFiles } from './preload-shared'

type Options = {
  m3u8Url: string, 
  chapterId: string, 
  id: string
}

type PreloadWorkerMessage = {
  type: 'preload'
  payload: {
    options: Options
    count?: number
  }
}

type PreloadWorkerResponse =
  | {
      type: 'done'
      payload: { m3u8Url: string; fetched: { length: number, cdn_server: string } & Options }
    }
  | {
      type: 'error'
      payload: { m3u8Url: string; error: string }
    }

let preloadWorker: Worker | null = null

const isWorkerSupported = () =>
  typeof window !== 'undefined' && typeof Worker !== 'undefined'

const setupWorker = () => {
  if (!isWorkerSupported()) {
    return null
  }

  if (!preloadWorker) {
    preloadWorker = new Worker(
      new URL('../workers/preload.worker.ts', import.meta.url),
      { type: 'module' }
    )

    preloadWorker.addEventListener('message', (event: MessageEvent<PreloadWorkerResponse>) => {
      const { type, payload } = event.data || {}
      if (type === 'error') {
        console.warn('Preload worker error:', payload)
        return
      }
      if(type === 'done') {
        reportSDK.eventReport({
          event_name: "m_cdn_server",
          sub_event_name: "",
          properties: {
            _scene_name: "cdn_server",
            _page_name: "",
            _pre_page_name: "",
            _url: location.href,
            _referrer_url: document.referrer,
            _story_id: payload?.fetched?.id,
            _chap_id: payload?.fetched?.chapterId,
            track_session_id: window.trackSessionId,
            _cdn_server: payload?.fetched?.cdn_server
          },
        });
      }
    })

    preloadWorker.addEventListener('error', (event) => {
      console.error('Preload worker crashed:', event.message)
      preloadWorker?.terminate()
      preloadWorker = null
    })
  }

  return preloadWorker
}

const fallbackPreload = async (options: Options, count?: number) => {
  const list = await getTSFiles(options)

  list.forEach((link: string, index: number) => {
    if (typeof count === 'number' && index >= count) {
      return
    }

    fetch(link, {
      cache: 'force-cache',
    }).catch((error) => {
      console.warn('Fallback preload failed for segment:', link, error)
    })
  })
}

const fetchM3U8Ts = (options: Options, count?: number) => {
  const worker = setupWorker()

  if (!worker) {
    void fallbackPreload(options, count)
    return
  }

  const message: PreloadWorkerMessage = {
    type: 'preload',
    payload: { options, count },
  }

  worker.postMessage(message)
}

export { fetchM3U8Ts,getTSFiles }
