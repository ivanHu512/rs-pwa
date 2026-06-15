import { useEffect } from "react";
import { useLocation, useSearchParams } from "react-router-dom";

declare global {
  interface Window {
    fbq: any;
    _fbq?: any;
  }
}

const FACEBOOK_PIXEL_SCRIPT_ID = "fb-pixel-script";
const initializedPixelIds = new Set<string>();

const loadFacebookPixelScript = () => {
  if (document.getElementById(FACEBOOK_PIXEL_SCRIPT_ID)) {
    return;
  }

  window.fbq =
    window.fbq ||
    function (...args: any[]) {
      if (window.fbq.callMethod) {
        window.fbq.callMethod(...args);
        return;
      }
      (window.fbq.queue = window.fbq.queue || []).push(args);
    };

  if (!window._fbq) {
    window._fbq = window.fbq;
  }

  window.fbq.push = window.fbq;
  window.fbq.loaded = true;
  window.fbq.version = "2.0";
  window.fbq.queue = window.fbq.queue || [];

  const script = document.createElement("script");
  script.id = FACEBOOK_PIXEL_SCRIPT_ID;
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  document.head.appendChild(script);
};

export const FacebookPixel = () => {
  const pathname = useLocation().pathname;
  const [searchParams] = useSearchParams();

  const pixelId =
    searchParams.get("pixel") || import.meta.env.VITE_FACEBOOK_PIXEL_ID;

  useEffect(() => {
    if (!pixelId) return;

    loadFacebookPixelScript();

    if (!initializedPixelIds.has(pixelId)) {
      window.fbq("init", pixelId);
      initializedPixelIds.add(pixelId);
    }

    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    window.fbq("track", "PageView", { url });
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) {
    return null;
  }

  return (
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: "none" }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  );
};

export const fbqEvent = (
  eventName: string,
  eventData?: Record<string, any>,
) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, eventData);
  }
};
