import { useEffect, useLayoutEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useShallow } from 'zustand/shallow'

import { useReport } from '@/hooks/use-report'
import { generateArmsScript } from '@/lib/arms'
import { localKeyUid, sessionKeyTraceId } from '@/lib/constant'
import { setReportPathName } from '@/lib/index'
import { emitReportCacheHandle, reportSDK } from '@/lib/report'
import { uploadH5VideoUrlReport } from '@/lib/services/book'
import { detectionPwaStandalone, visibilityProperties } from '@/lib/utils'
import { useDramaStore } from '@/stores/drama-store'
import { getLocalStorage } from '@/lib/storageUtils'
import PaySuccessModal from '@/components/success-modal'
import LoginPopup from '@/components/login-popup'
import { useLocation, useParams, useSearchParams } from "react-router-dom";

const MAX_REASONABLE_DURATION = 300000 // 5分钟
const MIN_REASONABLE_DURATION = 0

export default function Common() {
  const pathname = useLocation().pathname;
  const previousPathRef = useRef<string | null>(null)
  const { id } = useParams()
  const { currentChapter, userInfo } = useDramaStore(
    useShallow((state) => ({
      currentChapter: state.currentChapter,
      userInfo: state.userInfo,
    }))
  )
  const {
    reportHeart,
    pageEnter,
    resourceTimeReport,
    backUpReport,
    performanceReport,
    performanceScriptReport,
  } = useReport()
  /** 保存 playEvent 的参数，用于在 uid 存在时重新上报 */
  const savedPlayEventParamsRef = useRef<
    Parameters<typeof pageEnter>[0] | null
  >(null)
  const currentRef = useRef<any>({})
  const tsFileCountRef = useRef<number>(0)
  const hiddenTime = useRef<number>(Infinity)

  useLayoutEffect(() => {
    /**监听js脚本请求时长 */
    const isPwaEnv = detectionPwaStandalone()
    const handlePageLoad = () => {
      try {
        const jsEntries = performance
          .getEntriesByType('resource')
          .filter(
            (e) => (e as PerformanceResourceTiming).initiatorType === 'script'
          )
        if (!jsEntries.length) {
          return
        }
        const firstStart = Math.min(
          ...jsEntries.map((e) => (e as PerformanceResourceTiming).fetchStart)
        )
        const lastEnd = Math.max(
          ...jsEntries.map((e) => (e as PerformanceResourceTiming).responseEnd)
        )
        console.log(
          'JS 下载整体跨度 =',
          (lastEnd - firstStart).toFixed(2),
          'ms'
        )
        performanceScriptReport({
          _page_name: setReportPathName(pathname),
          from_type: isPwaEnv ? 1 : 2,
          start_time: firstStart,
          end_res: lastEnd,
          download_time_cost: (lastEnd - firstStart).toFixed(2),
        })
      } catch (error) {
        console.log(error)
      }
    }
    if (document.readyState === 'complete') {
      handlePageLoad()
    } else {
      window.addEventListener('load', handlePageLoad)
    }
    /**监听前进或后退事件，记录时间戳 */
    const popstateChange = () => {
      window.routerTime = Date.now()
    }
    window.addEventListener('popstate', popstateChange)

    const traceId = sessionStorage.getItem(sessionKeyTraceId)
    if (!traceId) {
      const newTraceId = uuidv4()
      sessionStorage.setItem(sessionKeyTraceId, newTraceId)
    }
    window.trackSessionId = `p-${uuidv4()}`
    reportSDK.installReport({
      _story_id: id,
      _page_name: 'player',
    })
    import('@arms/rum-browser').then((armsRum) => {
      armsRum.default.init(generateArmsScript())
      const uId = getLocalStorage(localKeyUid)
      if (uId) {
        armsRum.default?.setConfig('user', {
          name: uId,
        })
      }
      window.__rum = armsRum.default
    })
    if (!('PerformanceObserver' in window)) return
    const supportedEntries =
      (PerformanceObserver as any).supportedEntryTypes || []
    const canObservePaint =
      supportedEntries.includes?.('paint') &&
      supportedEntries.includes?.('largest-contentful-paint')
    if (!canObservePaint) return
    const isSupportConnection = 'connection' in navigator
    const customNavigator: NavigatorWithConnection = navigator
    const observer = new PerformanceObserver(
      (list: PerformanceObserverEntryList) => {
        const entries = list.getEntries() as PerformanceResourceTiming[]
        for (const entry of entries) {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-paint') {
              console.log('性能耗时FP:', entry.startTime, navigator)
              performanceReport({
                subEventName: 'FP',
                _page_name: setReportPathName(pathname),
                from_type: isPwaEnv ? 1 : 2,
                ...(entry.startTime < hiddenTime.current && {
                  _duration: entry.startTime,
                }),
                ...(isSupportConnection && {
                  _rtt: customNavigator?.connection?.rtt,
                  _effectiveType: customNavigator?.connection?.effectiveType,
                }),
              })
            } else if (entry.name === 'first-contentful-paint') {
              console.log('性能耗时FCP:', entry.startTime)
              performanceReport({
                subEventName: 'FCP',
                _page_name: setReportPathName(pathname),
                from_type: isPwaEnv ? 1 : 2,
                ...(entry.startTime < hiddenTime.current && {
                  _duration: entry.startTime,
                }),
                ...(isSupportConnection && {
                  _rtt: customNavigator?.connection?.rtt,
                  _effectiveType: customNavigator?.connection?.effectiveType,
                }),
              })
            }
          } else if (entry.entryType === 'largest-contentful-paint') {
            console.log('性能耗时LCP', entry.startTime)
            performanceReport({
              subEventName: 'LCP',
              _page_name: setReportPathName(pathname),
              from_type: isPwaEnv ? 1 : 2,
              ...(entry.startTime < hiddenTime.current && {
                _duration: entry.startTime,
              }),
              ...(isSupportConnection && {
                _rtt: customNavigator?.connection?.rtt,
                _effectiveType: customNavigator?.connection?.effectiveType,
              }),
            })
          }
        }
      }
    )
    try {
      observer.observe({ type: 'paint', buffered: true })
      observer.observe({ type: 'largest-contentful-paint', buffered: true })
    } catch {
      observer.disconnect()
    }
    return () => {
      window.removeEventListener('popstate', popstateChange)
      window.removeEventListener('load', handlePageLoad)
    }
  }, [])

  useEffect(() => {
    if (currentChapter.chapter_id) {
      currentRef.current = currentChapter
    }
    /**进入页面报一次 */
    const { hidden, visibilityChange } = visibilityProperties()
    if (!hidden || !visibilityChange) return
    const handleDocumentVisibilitychange = (e: Event) => {
      //   @ts-expect-error - visible事件
      if (!document[hidden]) {
        backUpReport({
          _story_id: id,
          _chap_id: currentChapter?.chapter_id,
          _page_name: setReportPathName(pathname),
          _pre_page_name: '', // 添加上一页路径
          action_ts: Date.now(),
          ctime: Math.floor(new Date().getTime() / 1000),
        })
      } else {
        hiddenTime.current = Math.min(hiddenTime.current, e.timeStamp)
      }
    }
    document.addEventListener(visibilityChange, handleDocumentVisibilitychange)
    if (!('PerformanceObserver' in window)) return
    const supportedEntries =
      (PerformanceObserver as any).supportedEntryTypes || []
    const canObserveResource = supportedEntries.includes?.('resource')
    if (!canObserveResource) return
    const chapterId = currentChapter.chapter_id
    tsFileCountRef.current = 0
    const observer = new PerformanceObserver(
      (list: PerformanceObserverEntryList) => {
        const entries = list.getEntries() as PerformanceResourceTiming[]
        for (const entry of entries) {
          if (
            (entry.name.endsWith('.ts') && tsFileCountRef.current < 3) ||
            entry.name.endsWith('.m3u8')
          ) {
            if (entry.name.endsWith('.ts')) {
              tsFileCountRef.current += 1
            }
            let duration = entry.duration
            if (
              duration > MAX_REASONABLE_DURATION ||
              duration < MIN_REASONABLE_DURATION
            ) {
              if (entry.responseEnd > 0 && entry.startTime > 0) {
                duration = entry.responseEnd - entry.startTime
              } else {
                duration = 0
              }
            }
            if (duration > 0) {
              // console.log(
              //   `资源加载耗时 [Chapter ID: ${chapterId}]: ${duration.toFixed(2)}ms`,
              //   {
              //     总耗时: entry.responseEnd - entry.requestStart,
              //     "Chapter ID": chapterId,
              //     URL: entry.name,
              //     DNS: entry.domainLookupEnd - entry.domainLookupStart,
              //     TCP: entry.connectEnd - entry.connectStart,
              //     响应:
              //       entry.responseEnd > 0 && entry.responseStart > 0
              //         ? entry.responseEnd - entry.responseStart
              //         : 0,
              //   },
              // );
              resourceTimeReport({
                _chap_id: chapterId,
                _story_id: id,
                _resource_name: entry.name,
                _duration: duration.toFixed(2),
                _dns_time: entry.domainLookupEnd - entry.domainLookupStart,
                _tcp_time: entry.connectEnd - entry.connectStart,
                _response_time:
                  entry.responseEnd > 0 && entry.responseStart > 0
                    ? entry.responseEnd - entry.responseStart
                    : 0,
                _page_name: setReportPathName(pathname),
              })
            }
          }
        }
      }
    )
    try {
      observer.observe({ type: 'resource', buffered: true })
    } catch {
      observer.disconnect()
    }
    return () => {
      observer.disconnect()
      document.removeEventListener(
        visibilityChange,
        handleDocumentVisibilitychange
      )
      currentRef.current = {}
    }
  }, [currentChapter?.chapter_id])

  /**
   * 浏览器点击到服务器响应时间耗时
   * @returns
   */
  const serverResponseDuration = () => {
    try {
      // 获取导航计时入口
      const [navEntry] = window.performance.getEntriesByType('navigation')
      if (navEntry) {
        // responseEnd: 服务器响应结束的时间点
        // startTime: 导航的起始点 (URL请求发起)
        // @ts-expect-error  xxx
        const timeElapsed = navEntry?.responseEnd - navEntry.startTime
        return {
          server_response_dur: timeElapsed,
          // @ts-expect-error  xxx
          domInteractive: navEntry?.domInteractive,
          // @ts-expect-error  xxx
          domComplete: navEntry?.domComplete,
        }
      }
      return {}
    } catch {
      return {}
    }
  }

  useEffect(() => {
    const isSupportPerformance =
      typeof performance !== 'undefined' &&
      typeof performance.timeOrigin === 'number'
    const isSupportConnection = 'connection' in navigator
    const customNavigator: NavigatorWithConnection = navigator
    const currentTime = Date.now()
    const url = new URL(window.location.href)
    const cpId = url.searchParams.get('cpId')
    const playEventParams = {
      _chap_id: cpId,
      from_type: detectionPwaStandalone() ? 1 : 2,
      _page_name: setReportPathName(pathname),
      _pre_page_name: '', // 添加上一页路径
      action_ts: currentTime,
      ctime: Math.floor(new Date().getTime() / 1000),
      ...(!window.routerTime && serverResponseDuration()),
      ...(isSupportConnection && {
        _rtt: customNavigator?.connection?.rtt,
        _effectiveType: customNavigator?.connection?.effectiveType,
      }),
      ...(isSupportPerformance && {
        page_time_cost:
          currentTime - (window.routerTime || performance.timeOrigin || 0),
      }),
    }
    savedPlayEventParamsRef.current = playEventParams
    pageEnter(playEventParams)
    return () => {
      savedPlayEventParamsRef.current = null
    }
  }, [pathname])

  useEffect(() => {
    console.log('userInfo', userInfo)
    if (!userInfo?.uid) {
      return
    }
    const url = new URL(window.location.href)
    const cpId = url.searchParams.get('cpId')
    reportHeart(setReportPathName(pathname), { chapter_id: cpId })
    emitReportCacheHandle()
    const intervalId: ReturnType<typeof setTimeout> = setInterval(() => {
      reportHeart(setReportPathName(pathname), currentRef.current)
    }, 30000)
    if (savedPlayEventParamsRef.current) {
      pageEnter(savedPlayEventParamsRef.current)
      savedPlayEventParamsRef.current = null
    }

    /** 投放上报 */
    if (pathname.includes('drama')) {
      uploadH5VideoUrlReport(window.location.href)
    }

    return () => {
      clearInterval(intervalId)
    }
  }, [userInfo?.uid, pathname])

  useEffect(() => {
    if (!userInfo?.uid) {
      return
    }
    try {
      window.__rum?.setConfig('user', {
        name: userInfo?.uid,
      })
    } catch {
      console.log("error")
    }
  }, [userInfo?.uid])

  // useEffect(() => {
  //   if (currentChapter?.chapter_id) {
  //     pageEnter({
  //       _page_name: setReportPathName(pathname),
  //       _pre_page_name: setReportPathName(previousPathRef.current || ""), // 添加上一页路径
  //     });
  //   }
  //   // 更新上一页路径为当前页，供下次使用
  //   previousPathRef.current = pathname;
  // }, [pathname, currentChapter?.chapter_id]);

  return (
    <>
      <LoginPopup />
      <PaySuccessModal />
    </>
  )
}
