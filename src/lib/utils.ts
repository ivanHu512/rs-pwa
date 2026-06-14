import { type ClassValue, clsx } from "clsx";
import { JSEncrypt } from "js-encrypt";
import { twMerge } from "tailwind-merge";

import { AccountInfo } from "@/types/drama";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 节流函数
 * @param {string} fn - 回调函数
 * @param {string} delay - 延迟时间
 * @param {string} immediate - 是否需要立即执行一次
 */
type ThrottledFunction<T extends unknown[]> = ((...args: T) => void) & {
  cancel: () => void;
};

export const throttleImmediate = <T extends unknown[]>(
  fn: (...args: T) => void,
  interval: number = 1000,
  immediate: boolean = false,
): ThrottledFunction<T> => {
  let lastExecTime = 0;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let isLeadingCall = true;
  const throttled = function (this: unknown, ...args: T) {
    const now = Date.now();
    const timeSinceLastExec = lastExecTime ? now - lastExecTime : Infinity;
    const timeToWait = Math.max(0, interval - timeSinceLastExec);
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    const shouldExecuteImmediate =
      immediate && (isLeadingCall || timeSinceLastExec >= interval);

    if (shouldExecuteImmediate) {
      fn.apply(this, args);
      lastExecTime = now;
      isLeadingCall = false;
    } else {
      timeoutId = setTimeout(() => {
        fn.apply(this, args);
        lastExecTime = Date.now();
        timeoutId = undefined;
        isLeadingCall = false;
      }, timeToWait);
    }
  } as ThrottledFunction<T>;

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
    }
    isLeadingCall = true;
    lastExecTime = 0;
  };

  return throttled;
};

/**判断是否是JSON对象字符串 */
export const isJSON = (str: string) => {
  if (typeof str == "string") {
    try {
      const obj = JSON.parse(str);
      if (typeof obj == "object" && obj) {
        return true;
      } else {
        return false;
      }
    } catch (e) {
      // console.log('error：'+str+'!!!'+e);
      return false;
    }
  } else {
    throw new Error("str is not a string");
  }

  // console.log('It is not a string!')
};

/**
 * 判断设备类型
 */
export const getMobileInfo = () => {
  if (typeof window === "undefined") return {};
  const u = navigator.userAgent;
  const isAndroid = u.indexOf("Android") > -1 || u.indexOf("Adr") > -1;
  const isIpad13 = /mac/.test(u) && navigator.maxTouchPoints > 1;
  const isIpadAir11 = /Mac/.test(u) && navigator.maxTouchPoints > 1;
  const isIos = /iPad|iPhone|iPod/.test(u) || isIpad13 || isIpadAir11;
  const isSafari = /Safari/.test(u);
  const isChrome = /CriOS/.test(u);
  const isFirefox = /FxiOS/.test(u);
  const osMatch = u.match(/OS ([\d_]+)/);
  const isSafari1731 = osMatch?.[1].replace(/_/g, ".") === "17.3.1";
  const isSafari1631 = osMatch?.[1].replace(/_/g, ".") === "16.3.1";
  return {
    isAndroid,
    isIos,
    isSafari,
    isSafari1731: isIos && isSafari && isSafari1731,
    isSafari1631: isIos && isSafari && isSafari1631,
  };
};

const REAPublicKey =
  "-----BEGIN PUBLIC KEY-----MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC6D4CRIl6AWxOS4Pq2l7nRCNw0nCIo9l4UdbbV5h5CkL57dVjT0sDSt3DpuqUyFZnsLiQ8apy2JmmFSFISpwXW4AReBgehiLP+rivkp2DqJDE/DQTagEerlhSUZm7wgzwXBVR0U9caT7EeFso0/Laz9/gVL1ufRh++HM7Zwe2UZwIDAQAB-----END PUBLIC KEY-----";

export const encrypt = async (
  message: string,
  publicKey = REAPublicKey,
): Promise<string> => {
  //  const JSEncrypt = (await import('js-encrypt')).default
  const jsencrypt = new JSEncrypt();
  jsencrypt.setPublicKey(publicKey);
  return jsencrypt.encrypt(message) || message;
};
/**
 * 格式化时间为 HH:MM:SS 或 MM:SS
 * @param time 秒数
 * @param forceHours 强制显示小时部分（默认自动判断）
 */
export const formatTime = (
  time: number = 0,
  forceHours: boolean = false,
): string => {
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);
  // 根据时间长度或参数决定是否显示小时
  const showHours = forceHours || hours > 0;
  return showHours
    ? `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
    : `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**删除地址栏指定参数 */
export function removeQueryParam(paramKey: string | string[]) {
  // 获取当前地址栏中的查询参数
  const queryParams = new URLSearchParams(window.location.search);

  // 如果参数是字符串，则直接删除对应的参数
  if (typeof paramKey === "string") {
    queryParams.delete(paramKey);
  }

  // 如果参数是数组，则遍历数组，删除每个字符串对应的参数
  if (Array.isArray(paramKey)) {
    paramKey.forEach((key) => {
      queryParams.delete(key);
    });
  }
  // 构建新的URL并进行跳转
  const newUrl = `${window.location.pathname}${
    queryParams.toString() ? "?" + queryParams.toString() : ""
  }`;
  window.history.replaceState({ path: newUrl }, "", newUrl);
}
/**
 * URL 参数管理工具类
 */
export class URLManager {
  private updateTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingParams: Map<string, string | null> = new Map();
  private readonly defaultDebounceDelay: number = 300;

  /**
   * 设置 URL 参数（防抖更新）
   */
  setParams(
    params: Record<string, string | null>,
    immediate: boolean = false,
  ): void {
    // 合并参数到待更新队列
    Object.entries(params).forEach(([key, value]) => {
      this.pendingParams.set(key, value);
    });
    if (immediate) {
      this.executeUpdate();
    } else {
      this.scheduleUpdate();
    }
  }
  /**
   * 立即执行更新（用于滑动结束等场景）
   */
  flush(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    this.executeUpdate();
  }
  /**
   * 取消待处理的更新
   */
  cancel(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
    this.pendingParams.clear();
  }
  private scheduleUpdate(): void {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }
    this.updateTimeout = setTimeout(() => {
      this.executeUpdate();
    }, this.defaultDebounceDelay);
  }
  private executeUpdate(): void {
    if (this.pendingParams.size === 0) return;
    const url = new URL(window.location.href);
    this.pendingParams.forEach((value, key) => {
      if (value === null || value === "") {
        url.searchParams.delete(key);
      } else {
        url.searchParams.set(key, value);
      }
    });
    window.history.replaceState({ path: url.href }, "", url.href);
    this.pendingParams.clear();
    this.updateTimeout = null;
  }
}

/** 复制文案 */
export const copy = async (text: string) => {
  if (!text) return false;

  // 1. 尝试使用现代 Clipboard API (HTTPS 环境下可用)
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text);
      console.log("copy success (clipboard api):", text);
      return true;
    } catch (err) {
      console.warn(
        "clipboard api copy failed, falling back to execCommand:",
        err,
      );
    }
  }

  // 2. Fallback: 传统的 execCommand 方案
  try {
    const oInput = document.createElement("input");
    oInput.value = text;
    // 防止 iOS 拉起键盘
    oInput.setAttribute("readonly", "readonly");
    // 基础样式：使其不可见但存在于文档中以支持选中
    oInput.style.position = "fixed";
    oInput.style.left = "-9999px";
    oInput.style.top = "0";
    oInput.style.opacity = "0";
    oInput.style.zIndex = "-1";

    document.body.appendChild(oInput);

    // 选中方案
    oInput.select();
    oInput.setSelectionRange(0, oInput.value.length);

    // 对于一些高版本 iOS，需要 Range 选中
    const range = document.createRange();
    range.selectNode(oInput);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    const successful = document.execCommand("copy");

    // 清理
    if (selection) {
      selection.removeAllRanges();
    }
    document.body.removeChild(oInput);

    if (successful) {
      console.log("copy success (execCommand):", text);
      return true;
    } else {
      throw new Error("execCommand copy unsuccessful");
    }
  } catch (err) {
    console.error("all copy methods failed:", err);
    return false;
  }
};

export function formateDate(time: number) {
  const d = new Date(time * 1000);
  return `${d.getFullYear()}.${d.getMonth() + 1}.${d.getDate()}`;
}

export function detectWebView() {
  const ua = navigator.userAgent;

  // 1. Android WebView 检测（最准确）
  if (/; wv\)/i.test(ua)) {
    return true; // Android 5.0+ WebView
  }

  // 2. iOS WebView 检测（修复版）
  const isSpecialIpad = /mac/i.test(ua) && navigator.maxTouchPoints > 1;
  if (/(iPhone|iPod|iPad)/i.test(ua) || isSpecialIpad) {
    // 排除所有独立浏览器
    const verify = !/Safari|CriOS|FxiOS|EdgiOS|OPiOS|Mercury|YaBrowser/i.test(
      ua,
    );
    if (!verify) {
      return /(FBAN|FBAV|FBBV|FBDV|FBSN|FBID|FBLC|FBRV|tiktok|snapchat|twitter)/i.test(
        ua,
      );
    }
    return verify;
  }

  // 3. 微信/钉钉等特殊 WebView
  if (/MicroMessenger|wxwork|DingTalk/i.test(ua)) {
    return true;
  }

  return false;
}

/**
 * 兼容不同浏览器
 * @returns hidden visibilityChange
 */
export const visibilityProperties = () => {
  if (typeof document === "undefined") {
    return { hidden: null, visibilityChange: null };
  }
  let hidden: string | null = null;
  let visibilityChange: string | null = null;
  if (typeof document.hidden !== "undefined") {
    hidden = "hidden";
    visibilityChange = "visibilitychange";
  } else if (typeof (document as any).webkitHidden !== "undefined") {
    hidden = "webkitHidden";
    visibilityChange = "webkitvisibilitychange";
  } else if (typeof (document as any).mozHidden !== "undefined") {
    hidden = "mozHidden";
    visibilityChange = "mozvisibilitychange";
  }
  return { hidden, visibilityChange };
};

/** 非广告会员且会员倒计时*/
export const isUserVip = (accountInfo?: AccountInfo) => {
  return accountInfo?.vip_category === 1 && !!accountInfo?.vip_sec;
};

export function getIOSVersion() {
  const userAgent = navigator.userAgent;
  const match = userAgent.match(/iPhone OS (\d+)_(\d+)/);
  if (match && match[1]) {
    return parseInt(match[1], 10); // 返回主版本号，如 15
  }
  return 0;
}

const range = 3;
export const getRangeAroundIndex = (
  currentIndex: number,
  targetIndex: number,
): boolean => {
  if (!Number.isInteger(currentIndex) || currentIndex < 0) {
    return false;
  }
  const start = Math.max(0, currentIndex - 1);
  const end = start + (range - 1);
  const isInRange =
    (targetIndex >= start && targetIndex <= end) || targetIndex === 0;
  return isInRange;
};

/**
 * 生成点赞数/收藏数
 */
export const getLikeNumber = (value: any): string => {
  const units = ["", "k", "M", "B", "T"]; // k: 千, M: 百万, B: 十亿, T: 万亿
  let unitIndex = 0;

  // 每次除以1000，直到数字小于1000或单位数组末尾
  while (value >= 1000 && unitIndex < units.length - 1) {
    value /= 1000;
    unitIndex++;
  }

  // 对数值进行四舍五入，保留一位小数（如果需要）
  const roundedValue = Math.round(value * 10) / 10;
  const formattedValue =
    roundedValue % 1 === 0 ? roundedValue.toFixed(0) : roundedValue.toFixed(1);

  return formattedValue + units[unitIndex];
};

/** 检测pwa环境 */
export const detectionPwaStandalone = () => {
  const detectionMethods = {
    displayMode: window.matchMedia("(display-mode: standalone)").matches,
    iosStandalone: "standalone" in navigator && navigator.standalone,
    fullscreen: window.matchMedia("(display-mode: fullscreen)").matches,
  };
  const isPwaEnv =
    detectionMethods.displayMode ||
    detectionMethods.iosStandalone ||
    detectionMethods.fullscreen;
  return isPwaEnv;
};

/** 获取url后面的h5mode参数 */
export const getH5mode = () => {
  const url = new URL(window.location.href);
  const model = url.searchParams.get("h5mode");
  return model;
};

/** 获取url后面的广告参数 */
export const getH5Advertise = () => {
  const url = new URL(window.location.href);
  const pixel = url.searchParams.get("pixel");
  const mediaType = url.searchParams.get("mediaType");
  return {
    pixel,
    mediaType,
  };
};

export const getConfigId = () => {
  const url = new URL(window.location.href);
  const model = url.searchParams.get("configId");
  return model;
};

/** 获取url后面的h5mode参数 */
export const verifyReptile = (ua?: string) => {
  const u = ua || (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const is_reptile =
    /facebookexternalhit|meta-webindexer|meta-externalads|meta-externalagent|meta-externalfetcher|webmasters\/crawler/.test(
      u.toLowerCase(),
    );
  return is_reptile;
};
