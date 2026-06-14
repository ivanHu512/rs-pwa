import { RefObject, useCallback, useRef } from "react";

const defaultHlsConfig = {
  enableWorker: true,
  lowLatencyMode: false,
  maxBufferLength: 3,
  maxMaxBufferLength: 5,
  abrEwmaFastVoD: 4.0,
  abrEwmaSlowVoD: 12.0,
  startLevel: 0,
  startPosition: -1,
  testBandwidth: true,
  autoStartLoad: true,
  enableSoftwareAES: true,
  stretchShortVideoTrack: true,
  forceKeyFrameOnDiscontinuity: true,
  fragLoadingMaxRetry: 2,
  fragLoadingMaxRetryTimeout: 20000,
  levelLoadingMaxRetry: 3,
  manifestLoadingMaxRetry: 3,
  progressive: false,
  maxBufferHole: 0.3,
  backBufferLength: 1,
  maxLoadingDelay: 4000
};

const getHlsFromWindow = (): HlsConstructor | undefined => {
  if (typeof window === "undefined") return undefined;
  return window.Hls;
};

type ResetOptions = { keepVideoSrc?: boolean };

interface UseHlsControllerOptions {
  videoRef: RefObject<HTMLVideoElement | null>;
  hlsConfig?: Record<string, unknown>;
}

export const useHlsController = ({
  videoRef,
  hlsConfig = defaultHlsConfig,
}: UseHlsControllerOptions) => {
  /** hls.js 实例 */
  const hlsRef = useRef<HlsInstance | null>(null);
  /** 标记当前是否使用原生 HLS（而非 HLS.js） */
  const isNativeHlsRef = useRef<boolean>(false);
  /** 重置视频资源 */
  const resetHls = useCallback(
    (options?: ResetOptions) => {
      try {
        if (hlsRef.current) {
          (hlsRef.current as any).stopLoad?.();
          (hlsRef.current as any).detachMedia?.();
        }
      } catch (error) {
        console.warn("HLS 清理失败:", error);
      }
    },
    [videoRef]
  );
  /** 销毁hls对象 */
  const destroyHls = useCallback(
    (options?: ResetOptions) => {
      try {
        if (hlsRef.current) {
          (hlsRef.current as any).detachMedia?.();
          (hlsRef.current as any).stopLoad?.();
          hlsRef.current.destroy?.();
          hlsRef.current = null;
        }
        if (videoRef.current && !options?.keepVideoSrc) {
          videoRef.current.src = "";
          videoRef.current.removeAttribute("src");
        }
      } catch (error) {
        console.warn("HLS 销毁失败:", error);
      } finally {
        hlsRef.current = null;
        isNativeHlsRef.current = false;
      }
    },
    [videoRef]
  );
  /** 加载hls资源 */
  const initHls = useCallback(
    (video: HTMLVideoElement, videoSrc: string) => {
      const Hls = getHlsFromWindow();
      const canUseHls = Hls?.isSupported();
      const canUseNative =
        video.canPlayType("application/vnd.apple.mpegurl") === "probably";
      const maybeUseNative =
        video.canPlayType("application/vnd.apple.mpegurl") === "maybe";
      console.log("m3u8支持性怎么样", Hls, canUseNative, maybeUseNative, canUseHls);
      if (!Hls) {
        if (canUseNative || maybeUseNative) {
          resetHls();
          isNativeHlsRef.current = true;
          if (video.src !== videoSrc) {
            video.src = String(videoSrc);
          }
          return;
        } else {
          resetHls();
          return;
        }
      }
      if (canUseNative) {
        if (hlsRef.current && !isNativeHlsRef.current) {
          resetHls();
        }
        isNativeHlsRef.current = true;
        if (video.src !== videoSrc) {
          video.src = String(videoSrc);
        }
      } else if (canUseHls) {
        if (hlsRef.current && !isNativeHlsRef.current) {
          hlsRef.current.loadSource(String(videoSrc));
          hlsRef.current.attachMedia(video);
          hlsRef.current.startLoad();
          return;
        }
        if (isNativeHlsRef.current) {
          resetHls();
        }
        const hls = new Hls(hlsConfig);
        hlsRef.current = hls;
        isNativeHlsRef.current = false;
        hls.loadSource(String(videoSrc));
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (!hlsRef.current) return;
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hlsRef.current.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hlsRef.current.recoverMediaError();
                break;
              default:
                resetHls();
                break;
            }
          }
        });
      } else if (maybeUseNative) {
        if (hlsRef.current && !isNativeHlsRef.current) {
          resetHls();
        }
        isNativeHlsRef.current = true;
        if (video.src !== videoSrc) {
          video.src = String(videoSrc);
        }
      } else {
        console.warn(
          "当前浏览器不支持 HLS 播放",
          videoSrc,
          canUseHls,
          canUseNative,
          maybeUseNative
        );
        resetHls();
      }
    },
    [hlsConfig, resetHls]
  );

  return {
    initHls,
    resetHls,
    destroyHls,
  };
};

