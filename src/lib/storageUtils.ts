/*********************  window rs_cache对象操作  *********************/
/** 设置临时缓存 */
const setWindowStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return
  const rs_cache = window.rs_cache || {}
  window.rs_cache = { ...rs_cache, [key]: value }
}

/** 获取临时缓存 */
const getWindowStorage = (key: string): string => {
  if (typeof window === 'undefined') return ''
  const rs_cache = window.rs_cache
  return rs_cache?.[key] || ''
}

/** 清除临时缓存 */
const removeWindowStorage = (key: string) => {
  if (typeof window === 'undefined') return null
  const rs_cache = window.rs_cache
  if (rs_cache?.[key]) delete window.rs_cache[key]
}
/*********************  window rs_cache对象操作  *********************/

/*********************  Session操作  *********************/
/** 设置sessionStorage缓存 */
const setSessionStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return ''
  setWindowStorage(key, value)
  sessionStorage.setItem(key, value)
}

/** 获取sessionStorage缓存 */
const getSessionStorage = (key: string): string => {
  if (typeof window === 'undefined') return ''
  let value = sessionStorage.getItem(key)
  // 存在则返回
  if (value) return value
  // 不存在取window, 同时重新设置
  value = getWindowStorage(key)
  if (value) setSessionStorage(key, value)
  return value || ''
}

/** 清理sessionStorage缓存 */
const removeSessionStorage = (key: string) => {
  if (typeof window === 'undefined') return null
  removeWindowStorage(key)
  sessionStorage.removeItem(key)
}
/*********************  Session操作  *********************/

/*********************  localStorage操作  *********************/
/** 设置localStorage缓存 */
const setLocalStorage = (key: string, value: any) => {
  if (typeof window === 'undefined') return ''
  setWindowStorage(key, value)
  return localStorage.setItem(key, value)
}

/** 获取localStorage缓存 */
const getLocalStorage = (key: string): string => {
  if (typeof window === 'undefined') return ''
  try {
    let value = localStorage.getItem(key)
    // 存在则返回
    if (value) return value
    // 不存在取window, 同时重新设置并判断是否上报
    value = getWindowStorage(key)
    if (value) {
      setLocalStorage(key, value)
    }
    return value || ''
  } catch (error) {
    return ''
  }
}

/** 清除localStorage缓存 */
const removeLocalStorage = (key: string) => {
  removeWindowStorage(key)
  localStorage.removeItem(key)
}

/** 获取localStorage所有值 */
const getAllStorage = () => {
  const storage: any = {}
  const l = localStorage.length > 50 ? 50 : localStorage.length
  try {
    for (let i = 0; i < l; i++) {
      const key = localStorage.key(i) as string
      storage[key] = localStorage.getItem(key)
    }
  } catch (error) {}
  return storage
}
/*********************  localStorage操作  *********************/

// 导出方法供其他模块使用
export {
  setWindowStorage,
  getWindowStorage,
  setSessionStorage,
  getSessionStorage,
  removeSessionStorage,
  setLocalStorage,
  getLocalStorage,
  getAllStorage,
  removeLocalStorage,
}
