type envType = 'local' | 'daily' | 'gray' | 'prod'
const envMap: Record<string, envType> = {
  development: 'local',
  test: 'daily',
  gray: 'gray',
  production: 'prod',
} as const

export function generateArmsScript() {
  const env = envMap[process.env.NEXT_PUBLIC_APP_ENV || 'development']
  return {
    pid: '1fw35mn5y7h@7fba2ddeae7ab9b',
    endpoint: 'https://1fw35mn5y7h-default-sea.rum.aliyuncs.com',
    env,
    sessionConfig: {
      sampleRate: env === 'prod' ? 0.01 : 1,
    },

    collectors: {
      staticResource: false,
    },
    filters: {
      exception: [
        'Apple',
        'The request is not',
        'GooglePay',
        'Apple Pay is not available',
        'One or more securedFields',
      ],
    },
    evaluateApi: async (options: any) => {
      if (options.url !== '/api/video/store/createThirdPayOrder') {
        return {}
      }
      const body = JSON.parse(options.body || '{}')
      const type = body.payType === 1 ? 'paypal' : 'adyen'

      return {
        name: 'createThirdPayOrder/' + type,
        snapshots: JSON.stringify(options.headers),
        properties: {
          uid: localStorage.getItem('uid'),
        },
      }
    },
    remoteConfig: true,
  }
}

/** Event type */
type armsPayType = 'pay_complete'
/**
 * Arms 支付事件自定义上报
 * @see https://help.aliyun.com/zh/arms/user-experience-monitoring/mini-program-sdk-configuration-reference
 */
export const armsPayReport = (
  type: armsPayType,
  properties?: Record<string, any>
) => {
  window?.__rum?.sendCustom?.({
    name: 'pay',
    group: '支付',
    type,
    value: 1,
    properties,
  })
}
