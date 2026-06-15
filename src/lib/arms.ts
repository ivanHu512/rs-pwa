import armsRum from "@arms/rum-browser";

const ARMS_ENDPOINT =
  "https://proj-xtrace-11267653def45730d450c2c832d128d5-ap-southeast-1.ap-southeast-1.log.aliyuncs.com/rum/web/v2?workspace=default-cms-5270080652696429-ap-southeast-1&service_id=1fw35mn5y7h@79bab11db7ff5b78e81f8";

const resolveArmsEnv = (): "prod" | "gray" | "pre" | "daily" | "local" => {
  const appEnv = import.meta.env.VITE_APP_ENV;

  if (appEnv === "prod") {
    return "prod";
  }

  if (appEnv === "gray") {
    return "gray";
  }

  if (appEnv === "test") {
    return "daily";
  }

  return import.meta.env.DEV ? "local" : "daily";
};

const resolveArmsSampleRate = () => {
  return import.meta.env.VITE_APP_ENV === "prod" ? 0.01 : 100;
};

armsRum.init({
  endpoint: ARMS_ENDPOINT,
  env: resolveArmsEnv(),
  spaMode: "history",
  sessionConfig: {
    sampleRate: resolveArmsSampleRate(),
  },
  collectors: {
    perf: true,
    webVitals: true,
    api: true,
    staticResource: true,
    jsError: true,
    consoleError: true,
    action: true,
  },
  tracing: false,
});

window.__rum = armsRum;

export default armsRum;

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
