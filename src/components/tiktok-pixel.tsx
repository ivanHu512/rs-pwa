import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

declare global {
  interface Window {
    TiktokAnalyticsObject?: string;
    ttq: any;
  }
}

const loadedPixelIds = new Set<string>();

const loadTikTokPixelScript = () => {
  const w = window as any;
  const libName = "ttq";

  if (w[libName]?.load) {
    return;
  }

  w.TiktokAnalyticsObject = libName;
  const ttq = (w[libName] = w[libName] || []);
  ttq.methods = [
    "page",
    "track",
    "identify",
    "instances",
    "debug",
    "on",
    "off",
    "once",
    "ready",
    "alias",
    "group",
    "enableCookie",
    "disableCookie",
  ];
  ttq.setAndDefer = (target: any, method: string) => {
    target[method] = (...args: any[]) => {
      target.push([method].concat(args));
    };
  };
  for (let i = 0; i < ttq.methods.length; i += 1) {
    ttq.setAndDefer(ttq, ttq.methods[i]);
  }
  ttq.instance = (pixelId: string) => {
    const instance = ttq._i[pixelId] || [];
    for (let i = 0; i < ttq.methods.length; i += 1) {
      ttq.setAndDefer(instance, ttq.methods[i]);
    }
    return instance;
  };
  ttq.load = (pixelId: string, options?: Record<string, any>) => {
    const src = "https://analytics.tiktok.com/i18n/pixel/events.js";
    ttq._i = ttq._i || {};
    ttq._i[pixelId] = [];
    ttq._i[pixelId]._u = src;
    ttq._t = ttq._t || {};
    ttq._t[pixelId] = Date.now();
    ttq._o = ttq._o || {};
    ttq._o[pixelId] = options || {};

    const script = document.createElement("script");
    script.type = "text/javascript";
    script.async = true;
    script.src = `${src}?sdkid=${pixelId}&lib=${libName}`;
    document.head.appendChild(script);
  };
};

export const TikTokPixel = () => {
  const [searchParams] = useSearchParams();
  const pixelId =
    searchParams.get("pixel") || import.meta.env.VITE_TIKTOK_PIXEL_ID;

  useEffect(() => {
    if (!pixelId) return;

    loadTikTokPixelScript();

    if (!loadedPixelIds.has(pixelId)) {
      window.ttq.load(pixelId);
      loadedPixelIds.add(pixelId);
    }

    window.ttq.page();
  }, [pixelId]);

  return null;
};

export const tiktokEvent = (
  eventName: string,
  eventData?: Record<string, any>,
) => {
  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track(eventName, eventData);
  }
};

export const TikTokEvents = {
  VIEW_CONTENT: "ViewContent",
  SEARCH: "Search",
  ADD_TO_CART: "AddToCart",
  ADD_TO_WISHLIST: "AddToWishlist",
  INITIATE_CHECKOUT: "InitiateCheckout",
  ADD_PAYMENT_INFO: "AddPaymentInfo",
  PURCHASE: "Purchase",
  VIEW_ITEM: "ViewItem",
  VIEW_ITEM_LIST: "ViewItemList",
  SELECT_ITEM: "SelectItem",
  REMOVE_FROM_CART: "RemoveFromCart",
  ACHIEVE_LEVEL: "AchieveLevel",
  UNLOCK_ACHIEVEMENT: "UnlockAchievement",
  SPEND_CREDITS: "SpendCredits",
  COMPLETE_REGISTRATION: "CompleteRegistration",
  SUBMIT_APPLICATION: "SubmitApplication",
  SUBSCRIBE: "Subscribe",
  START_TRIAL: "StartTrial",
  AD_CLICK: "AdClick",
  AD_IMPRESSION: "AdImpression",
};
