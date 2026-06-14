import { headers } from 'next/headers'
import { getSiteConfigByHostname } from './site'

/**
 * Get site configuration based on hostname.
 * In Next.js Server Components, we can call this to get the current config.
 */
export async function getSiteConfig() {
  const host = (await headers()).get('host') || ''
  // Remove port if present (e.g., localhost:3000)
  const hostname = host.split(':')[0]

  return getSiteConfigByHostname(hostname)
}

export function getSiteServerConfig(host: string) {
  const hostname = host.split(':')[0]
  return getSiteConfigByHostname(hostname)
}
