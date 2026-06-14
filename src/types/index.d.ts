export type IProduct = {
  gid: number //商品id
  coins: number //加上赠送的以后虚拟币总数量
  bonus: number
  discount: number
  price: string //价格
  currency: string
  type: number
  mark: string
  vip_type: number //0 ipa 1 vip
  identifier?: string
  product_id: string
  promotion_price: string
  is_leave?: number // 自定义字段，1 标识是挽留弹窗的商品
}

export type PayMethodsResponseData = {
  paymentMethods: any[]
  storedPaymentMethods?: StoredPaymentMethod[]
  country_code: string
  ip: string
  currency: string
}

export type PaySuccessInfo = {
  addCoins: number
  chapterId?: string
  stroyId?: string
  isSubscription: boolean
  gid?: string
  vip_expire?: number
}

/** 缓存信息 */
export type OrderInfo = {
  order_id?: string
  adyen_result_code?: string
  merchant_order_id?: string
  add_coins?: number
  add_bonus?: number
  pay_channel?: string
  is_historical_card_payment?: number
  pay_channel_sub_class?: string
  isSubscription?: boolean
  gid?: number
  product_id?: string
  chap_order_id?: number
  chapter_id?: string
  discountId?: string
  t_book_id?: string
  amount?: string
  _order_src?: string
}

export type PayerMax = {
  country: string
  payermax_pay_methods: {
    iap: {
      methodType: string
      targetOrg: string
    }[]
    vip: {
      methodType: string
      targetOrg: string
    }[]
  }
}
