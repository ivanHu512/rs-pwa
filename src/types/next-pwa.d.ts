declare module "next-pwa" {
  import type { NextConfig } from "next";

  export interface PWAOptions {
    dest?: string;
    register?: boolean;
    skipWaiting?: boolean;
    clientsClaim?: boolean;
    sw?: string;
    importScripts?: string[];
    disable?: boolean | (() => boolean);
    buildExcludes?: (string | RegExp)[];
    publicExcludes?: (string | RegExp)[];
    runtimeCaching?: unknown;
    reloadOnOnline?: boolean;
  }

  type NextConfigEnhancer = (nextConfig?: NextConfig) => NextConfig;

  export default function withPWA(options?: PWAOptions): NextConfigEnhancer;
}

