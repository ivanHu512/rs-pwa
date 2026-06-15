import { fbqEvent } from '@/components/facebook-pixel'
import { tiktokEvent, TikTokEvents } from '@/components/tiktok-pixel'

type PixelParams = {
  story_id: string
  amount?: number
  product_name?: string
}

const sendGAEvent = (
  command: 'event',
  eventName: string,
  params?: Record<string, any>
) => {
  window.gtag?.(command, eventName, params)
}

export const pixelAddCart = (data: PixelParams) => {
  const { amount = 0, story_id } = data

  tiktokEvent(TikTokEvents.ADD_TO_CART, {
    contents: [
      {
        content_id: data.story_id, // string. ID of the product. Example: "1077218".
        content_type: 'product', // string. Either product or product_group.
        content_name: '', // string. The name of the page or product. Example: "shirt".
      },
    ],
    value: amount, // number. Value of the order or items sold. Example: 100.
    currency: 'USD', // string. The 4217 currency code. Example: "USD".
  })

  fbqEvent('AddToCart', {
    value: amount,
    currency: 'USD',
    content_ids: `${story_id}`,
    content_type: 'product',
  })
  sendGAEvent('event', 'add_to_cart', {
    value: amount,
    currency: 'USD',
    items: [
      {
        item_id: story_id,
      },
    ],
  })
}

export const pixelPurchase = (data: PixelParams) => {
  const { amount = 0, story_id } = data
  tiktokEvent(TikTokEvents.PURCHASE, {
    value: amount, // 订单总金额
    currency: 'USD', // 货币类型
    contents: [
      {
        content_id: story_id, // 商品ID
        content_name: '', // 商品名称
        content_type: 'product',
      },
    ],
  })

  fbqEvent('Purchase', {
    value: amount,
    currency: 'USD',
    content_ids: `${story_id}`,
    content_type: 'product',
  })

  sendGAEvent('event', 'purchase', {
    value: amount,
    currency: 'USD',
    items: [
      {
        item_id: story_id,
      },
    ],
  })
}

export const pixelSubscribe = (data: PixelParams) => {
  const { story_id, amount } = data

  fbqEvent('Subscribe', {
    value: amount,
    currency: 'USD',
    content_ids: `${story_id}`,
    content_type: 'product',
  })
}

export const pixelViewContent = (data: PixelParams) => {
  const { story_id } = data
  tiktokEvent(TikTokEvents.VIEW_CONTENT, {
    contents: [
      {
        content_id: story_id, // string. ID of the product. Example: "1077218".
        content_type: 'product', // string. Either product or product_group.
        content_name: '', // string. The name of the page or product. Example: "shirt".
      },
    ],
  })
  fbqEvent('ViewContent', {
    content_ids: `${story_id}`,
    content_type: 'product',
  })
  sendGAEvent('event', 'view_item', {
    items: [
      {
        item_id: story_id,
      },
    ],
  })
}

export const pixelCompleteRegistration = (data: PixelParams) => {
  const { story_id } = data
  tiktokEvent(TikTokEvents.COMPLETE_REGISTRATION, {
    contents: [
      {
        content_id: story_id, // string. ID of the product. Example: "1077218".
        content_type: 'product', // string. Either product or product_group.
        content_name: '', // string. The name of the page or product. Example: "shirt".
      },
    ],
  })
  fbqEvent('CompleteRegistration', {
    content_ids: `${story_id}`,
    content_type: 'product',
  })
}
