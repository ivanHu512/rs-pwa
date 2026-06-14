"use client";

import { useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    ttq: any;
  }
}

export const TikTokPixel = () => {
  const searchParams = useSearchParams();
  const pixelId =
    searchParams.get("pixel") || process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    // Initialize TikTok Pixel
    window.ttq = window.ttq || [];
    window.ttq.load(pixelId);
    // Track page view
    window.ttq.page();
  }, [pixelId]);

  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="tt-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `!function (w, d, t) {w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};}(window, document, 'ttq');`,
        }}
      />
    </>
  );
};

// Helper function to track custom events
export const tiktokEvent = (
  eventName: string,
  eventData?: Record<string, any>,
) => {
  if (typeof window !== "undefined" && window.ttq) {
    window.ttq.track(eventName, eventData);
  }
};

// Common TikTok events
export const TikTokEvents = {
  // Standard Events
  VIEW_CONTENT: "ViewContent",
  SEARCH: "Search",
  ADD_TO_CART: "AddToCart",
  ADD_TO_WISHLIST: "AddToWishlist",
  INITIATE_CHECKOUT: "InitiateCheckout",
  ADD_PAYMENT_INFO: "AddPaymentInfo",
  PURCHASE: "Purchase",

  // E-commerce Events
  VIEW_ITEM: "ViewItem",
  VIEW_ITEM_LIST: "ViewItemList",
  SELECT_ITEM: "SelectItem",

  REMOVE_FROM_CART: "RemoveFromCart",

  // Game Events
  ACHIEVE_LEVEL: "AchieveLevel",
  UNLOCK_ACHIEVEMENT: "UnlockAchievement",
  SPEND_CREDITS: "SpendCredits",

  // Other Events
  COMPLETE_REGISTRATION: "CompleteRegistration",
  SUBMIT_APPLICATION: "SubmitApplication",
  SUBSCRIBE: "Subscribe",
  START_TRIAL: "StartTrial",
  AD_CLICK: "AdClick",
  AD_IMPRESSION: "AdImpression",
};

// Example usage in your checkout success handler:
// tiktokEvent(TikTokEvents.PURCHASE, {
//   content_type: 'product',
//   content_name: 'Product Name',
//   content_ids: ['123'],
//   contents: [{
//     id: '123',
//     quantity: 1,
//     price: 9.99
//   }],
//   value: 9.99,
//   currency: 'USD',
//   order_id: 'order_123'
// });
