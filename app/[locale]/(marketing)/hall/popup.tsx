'use client'

import dynamic from "next/dynamic";
const PwaGuide = dynamic(() => import("@/components/pwa-guide"), {
  ssr: false,
});


export default function Popup() {
  return (
    <>
      <PwaGuide />
    </>
  )
}
