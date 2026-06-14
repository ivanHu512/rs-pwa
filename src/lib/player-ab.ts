import { cache } from 'react'

import type { VideoPlayerVariant } from '@/types/drama'

export const videoPlayerVariantStorageKey = 'rs_video_player_variant'

export const getVideoPlayerVariant = cache((): VideoPlayerVariant => {
  return Math.random() < 0.33 ? 'ali' : 'native'
})
