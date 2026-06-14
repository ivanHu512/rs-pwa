"use client";

import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";
import { useEffect } from "react";

declare global {
  interface Window {
    fbq: any;
  }
}

export const FacebookPixel = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pixelId =
    searchParams.get("pixel") || process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

  useEffect(() => {
    if (!pixelId) return;

    // Initialize Facebook Pixel
    window.fbq =
      window.fbq ||
      function (...args: any[]) {
        (window.fbq.q = window.fbq.q || []).push(args);
      };

    window.fbq("init", pixelId);
    window.fbq("track", "PageView");

    // Track page view on route change
    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    window.fbq("track", "PageView", { url });
  }, [pathname, searchParams, pixelId]);

  if (!pixelId) {
    return null;
  }

  return (
    <>
      <Script
        id="fb-pixel-script"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
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
