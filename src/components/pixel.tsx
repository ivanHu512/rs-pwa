"use client";
import { useSearchParams } from "react-router-dom";
import { Suspense } from "react";

import { FacebookPixel } from "./facebook-pixel";
import { TikTokPixel } from "./tiktok-pixel";

function PixelContent() {
  const [searchParams] = useSearchParams();
  const mediaType = searchParams.get("mediaType") || "";

  if (!mediaType) {
    return null;
  }

  return (
    <>
      {mediaType === "fb" && <FacebookPixel />}
      {mediaType === "tt" && <TikTokPixel />}
    </>
  );
}

export default function Pixel() {
  return (
    <Suspense fallback={null}>
      <PixelContent />
    </Suspense>
  );
}
