// components/player-variant-provider.tsx
'use client'

import { createContext, useContext } from 'react'
import type { VideoPlayerVariant } from '@/types/drama'

const PlayerVariantContext = createContext<VideoPlayerVariant>('native')

export default function PlayerVariantProvider({
  playerVariant,
  children,
}: {
  playerVariant: VideoPlayerVariant
  children: React.ReactNode
}) {
  return (
    <PlayerVariantContext.Provider value={playerVariant}>
      {children}
    </PlayerVariantContext.Provider>
  )
}

export function usePlayerVariant() {
  return useContext(PlayerVariantContext)
}
