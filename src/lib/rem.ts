/** 将px转换为vw */
export const pxToVw = (px: number) => {
  return `${(px / 375) * 100}vw`
}