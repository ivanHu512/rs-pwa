import { useEffect, useRef } from "react";
import { useReport } from "@/hooks/use-report";

const MAX_REASONABLE_DURATION = 300000; // 5分钟
const MIN_REASONABLE_DURATION = 0;

interface UsePerformanceOptions {
  chapterId?: string;
  storyId?: string;
}

export const usePerformance = ({ chapterId }: UsePerformanceOptions) => {
  const {
    resourceTimeReport,
    performanceScriptReport,
    performanceReport,
    backUpReport,
  } = useReport();
  /** 记录上报的视频资源数量 */
  const tsFileCountRef = useRef<number>(0);
  /** 记录切屏时间 */
  const hiddenTime = useRef<number>(Infinity);

  /** 性能埋点
   * 监听js脚本请求时长
   */
  useEffect(() => {
    const handlePageLoad = () => {
      try {
        const jsEntries = performance
          .getEntriesByType("resource")
          .filter(
            (e) => (e as PerformanceResourceTiming).initiatorType === "script",
          );
        if (!jsEntries.length) {
          return;
        }
        const firstStart = Math.min(
          ...jsEntries.map((e) => (e as PerformanceResourceTiming).fetchStart),
        );
        const lastEnd = Math.max(
          ...jsEntries.map((e) => (e as PerformanceResourceTiming).responseEnd),
        );
        console.log(
          "JS 下载整体跨度 =",
          (lastEnd - firstStart).toFixed(2),
          "ms",
        );
        performanceScriptReport({
          _page_name: "player",
          from_type: 2,
          start_time: firstStart,
          end_res: lastEnd,
          download_time_cost: (lastEnd - firstStart).toFixed(2),
        });
      } catch (error) {
        console.log(error);
      }
    };
    if (document.readyState === "complete") {
      handlePageLoad();
    } else {
      window.addEventListener("load", handlePageLoad);
    }

    /**监听前进或后退事件，记录时间戳 */
    const popstateChange = () => {
      window.routerTime = Date.now();
    };
    window.addEventListener("popstate", popstateChange);

    if (!("PerformanceObserver" in window)) return;
    const supportedEntries =
      (PerformanceObserver as any).supportedEntryTypes || [];
    const canObservePaint =
      supportedEntries.includes?.("paint") &&
      supportedEntries.includes?.("largest-contentful-paint");
    if (!canObservePaint) return;
    const isSupportConnection = "connection" in navigator;
    const customNavigator: NavigatorWithConnection = navigator;
    const observer = new PerformanceObserver(
      (list: PerformanceObserverEntryList) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        for (const entry of entries) {
          if (entry.entryType === "paint") {
            if (entry.name === "first-paint") {
              console.log("性能耗时FP:", entry.startTime, navigator);
              performanceReport({
                subEventName: "FP",
                _page_name: "player",
                from_type: 2,
                ...(entry.startTime < hiddenTime.current && {
                  _duration: entry.startTime,
                }),
                ...(isSupportConnection && {
                  _rtt: customNavigator?.connection?.rtt,
                  _effectiveType: customNavigator?.connection?.effectiveType,
                }),
              });
            } else if (entry.name === "first-contentful-paint") {
              console.log("性能耗时FCP:", entry.startTime);
              performanceReport({
                subEventName: "FCP",
                _page_name: "player",
                from_type: 2,
                ...(entry.startTime < hiddenTime.current && {
                  _duration: entry.startTime,
                }),
                ...(isSupportConnection && {
                  _rtt: customNavigator?.connection?.rtt,
                  _effectiveType: customNavigator?.connection?.effectiveType,
                }),
              });
            }
          } else if (entry.entryType === "largest-contentful-paint") {
            console.log("性能耗时LCP", entry.startTime);
            performanceReport({
              subEventName: "LCP",
              _page_name: "player",
              from_type: 2,
              ...(entry.startTime < hiddenTime.current && {
                _duration: entry.startTime,
              }),
              ...(isSupportConnection && {
                _rtt: customNavigator?.connection?.rtt,
                _effectiveType: customNavigator?.connection?.effectiveType,
              }),
            });
          }
        }
      },
    );
    try {
      observer.observe({ type: "paint", buffered: true });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      observer.disconnect();
    }
    return () => {
      window.removeEventListener("popstate", popstateChange);
      window.removeEventListener("load", handlePageLoad);
    };
  }, []);

  useEffect(() => {
    /**进入页面报一次 */
    if (!chapterId) return;
    const handleDocumentVisibilitychange = (e: Event) => {
      if (!document["hidden"]) {
        backUpReport({
          _chap_id: chapterId,
          _page_name: "player",
          _pre_page_name: "", // 添加上一页路径
          action_ts: Date.now(),
          ctime: Math.floor(new Date().getTime() / 1000),
        });
      } else {
        hiddenTime.current = Math.min(hiddenTime.current, e.timeStamp);
      }
    };
    document.addEventListener(
      "visibilityChange",
      handleDocumentVisibilitychange,
    );
    if (!("PerformanceObserver" in window)) return;
    const supportedEntries =
      (PerformanceObserver as any).supportedEntryTypes || [];
    const canObserveResource = supportedEntries.includes?.("resource");
    if (!canObserveResource) return;
    tsFileCountRef.current = 0;
    const observer = new PerformanceObserver(
      (list: PerformanceObserverEntryList) => {
        const entries = list.getEntries() as PerformanceResourceTiming[];
        for (const entry of entries) {
          if (
            (entry.name.endsWith(".ts") && tsFileCountRef.current < 3) ||
            entry.name.endsWith(".m3u8")
          ) {
            if (entry.name.endsWith(".ts")) {
              tsFileCountRef.current += 1;
            }
            let duration = entry.duration;
            if (
              duration > MAX_REASONABLE_DURATION ||
              duration < MIN_REASONABLE_DURATION
            ) {
              if (entry.responseEnd > 0 && entry.startTime > 0) {
                duration = entry.responseEnd - entry.startTime;
              } else {
                duration = 0;
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
                _resource_name: entry.name,
                _duration: duration.toFixed(2),
                _dns_time: entry.domainLookupEnd - entry.domainLookupStart,
                _tcp_time: entry.connectEnd - entry.connectStart,
                _response_time:
                  entry.responseEnd > 0 && entry.responseStart > 0
                    ? entry.responseEnd - entry.responseStart
                    : 0,
                _page_name: "player",
              });
            }
          }
        }
      },
    );
    try {
      observer.observe({ type: "resource", buffered: true });
    } catch {
      observer.disconnect();
    }
    return () => {
      observer.disconnect();
      document.removeEventListener(
        "visibilityChange",
        handleDocumentVisibilitychange,
      );
    };
  }, [chapterId]);
};
