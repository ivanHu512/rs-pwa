import { requestH5DramaSign } from '../request'
interface IResponse {
  code: number
  data: any
}

// export type PayMethodsResponseData = {
//   paymentMethods: any[];
//   storedPaymentMethods?: StoredPaymentMethod[];
//   country_code: string;
//   ip: string;
//   currency: string;
// };

/**创建订单 */
export type CreateOrderParams = {
  gid: number // 商品id
  return_url: string //成功落地页
  cancel_url?: string //取消落地页
  payType: number // 支付方式，0=谷歌普通支付 1=PayPal支付 99=ayden
  //adyen 支付必传
  adyen_payment_method?: string
  adyen_threeDS?: string
  exchange_rate?: string
  currency?: string
  adyen_params?: string
  if_renewal?: number
  amount?: number
  identifier?: string
  third_discount_disable: number
}

export interface CheckOrderParams {
  order_id: string //	订单id
  merchant_order_id: string //	三方订单id
  owner_uid?: number //	订单所有者uid
  package_name?: string //	包名
  merchant_receipt_data?: string //三方支付渠道返回的订单详情
  adyen_details?: string
}

/**
 * 创建订单
 * @param data
 * @returns
 */
export const createOrder = async (data: CreateOrderParams): Promise<any> => {
  return requestH5DramaSign('/api/video/store/createThirdPayOrder', data)
}

export async function checkOrder(data: CheckOrderParams) {
  const param = {
    ...data,
    merchant_receipt_data: 'h5',
    package_name: 'h5',
  }
  return requestH5DramaSign('/api/video/store/checkOrder', param)
}

export const getStoreList = async () => {
  const res: any = await requestH5DramaSign<IResponse>(
    '/api/video/store/getStoreListV2'
  )
  if (res.code == 0) {
    return res.data
  } else {
    return null
  }
}

/**
 * details
 * @param params
 * @returns
 */
export const adyenPaymentsCheck = (params: any): Promise<any> => {
  return requestH5DramaSign('/api/video/payment/paymentCheckAdyen', params)
}

/**
 * adyen 续订
 * @param params
 * @returns
 */
export const adyenRecoverSub = (params: { order_id: string }) => {
  return requestH5DramaSign('/api/video/store/AdyenRecoverSub', {
    method: 'post',
    data: params,
  })
}
type PayMethodParam = {
  country_code?: string
  currency?: string
  amount?: number
  is_get_default?: number
}
/** 获取支付方式 */
export async function getAdyenPayMethods(data: PayMethodParam = {}) {
  return await requestH5DramaSign('/api/video/payment/getPaymentMethodAdyen', {
    method: 'post',
    data: {
      channel: 'Web',
      // 支付方式由价格货币和地区决定，300是一个不会大小或或太大导致支付方式不返回的价格
      amount: 300,
      ...data,
    },
  })
}

/**
 * https://showdoc.stardustworld.cn/web/#/86?page_id=19353
 */
export const getThirdSubInfo = () => {
  return requestH5DramaSign('/api/video/store/getThirdSubInfo', {
    method: 'post',
  })
}
