'use client'
import { useParams } from 'next/navigation'
import { useCallback, useEffect, useRef } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useShallow } from 'zustand/shallow'

import { getOrderInfo } from '@/lib/checkout'
import { localKeyUid, sessionKeyTraceId } from '@/lib/constant'
import { getCookie, LOGIN_POSITION } from '@/lib/cookies'
import { reportCacheHandle, reportSDK } from '@/lib/report'
import { useDramaStore } from '@/stores/drama-store'
import { verifyReptile } from '@/lib/utils'
import {
  getLocalStorage,
  getSessionStorage,
  setSessionStorage,
} from '@/lib/storageUtils'
export function useReport() {
  const params = useParams()
  const { id } = params
  const { currentChapter, userInfo } = useDramaStore(
    useShallow((state) => ({
      currentChapter: state.currentChapter,
      userInfo: state.userInfo,
    }))
  )

  //保存ref，fix 某些闭包下获取不到currentChapter
  const chapterRef = useRef(currentChapter)

  const chapterId = currentChapter?.chapter_id || ''
  const duration = currentChapter?.duration || 0
  const videoId = currentChapter?.video_id || ''
  const videoType = currentChapter.video_type || 1
  const dpi = currentChapter.dpi || 720
  const sort = currentChapter.serial_number || 0

  useEffect(() => {
    chapterRef.current = currentChapter
  }, [currentChapter])

  /** 心跳上报 */
  const reportHeart = (page_name?: string, chapter: any = {}) => {
    reportSDK.eventReport({
      event_name: 'm_app_heart',
      sub_event_name: '',
      properties: {
        _app_account_bindtype: 'vistor',
        _scene_name: page_name === 'player' ? 'chap_play_scene' : 'main_scene',
        _page_name: page_name,
        _story_id: id,
        _chap_id: chapter?.chapter_id || '',
        _chap_order_id: chapter?.serial_number || 0,
        _url: location.href,
      },
    })
  }

  /** 支付上报 */
  const payReport = (
    data: { eventName: string; other?: any },
    isCache?: boolean
  ) => {
    const { eventName, other = {} } = data
    let orderInfo = getOrderInfo()

    // 只有这几个事件才会报订单信息
    if (
      ![
        'pay_start',
        'pay_failed',
        'pay_complete',
        'pay_cancel',
        'pay_end',
      ].includes(eventName)
    ) {
      orderInfo = {
        ...orderInfo,
        merchant_order_id: '',
        order_id: '',
        pay_channel: '',
        pay_channel_sub_class: '',
      }
    }

    const _channel_orderid = orderInfo?.merchant_order_id || ''
    const _app_orderid = orderInfo?.order_id || ''
    const _app_suk = orderInfo?.gid || other?.gid || ''
    const _channel_sku = orderInfo?.product_id || other?.product_id || ''
    const discount_config_id = orderInfo?.discountId || other?.discountId || ''

    console.log('report', other)

    const params = {
      event_name: 'm_pay_event',
      sub_event_name: eventName,
      properties: {
        _scene_name: 'chap_play_scene',
        _page_name: 'player',
        _order_src: orderInfo?._order_src || 'chap_fast_pay',
        _order_currency_type: 'USD',
        _story_id: id, // 快捷支付上报
        _chap_id: chapterRef.current?.chapter_id || '', // 快捷支付上报
        _chap_order_id: chapterRef.current?.serial_number || 0, // 快捷支付上报
        t_book_id: chapterRef.current?.t_book_id || '', // 快捷支付上报
        _app_orderid,
        _channel_orderid,
        _url: location.href,
        _app_sku: _app_suk,
        _channel_sku,
        _order_amount: Math.round(Number(orderInfo?.amount) * 100) || 0,
        pay_channel: orderInfo?.pay_channel || '',
        pay_channel_sub_class: orderInfo?.pay_channel_sub_class || '',
        discount_config_id,
        ...other,
      },
    }

    if (isCache) {
      reportCacheHandle(params)
    } else {
      reportSDK.eventReport(params)
    }
  }

  const pageEnter = useCallback(
    (properties: Record<string, any>) => {
      let traceId = getSessionStorage(sessionKeyTraceId)
      if (!traceId) {
        traceId = uuidv4()
        setSessionStorage(sessionKeyTraceId, traceId)
      }
      const { ctime, _page_name, from_type, _chap_id, ...rest } = properties
      reportSDK.eventReport({
        event_name: 'm_page_enter',
        sub_event_name: '',
        properties: {
          _scene_name:
            _page_name === 'player' ? 'chap_play_scene' : 'main_scene',
          _page_name,
          _pre_page_name: '',
          _url: location.href,
          _referrer_url: document.referrer,
          _story_id: id,
          _chap_id: _page_name === 'player' ? _chap_id || chapterId || '' : '',
          _chap_order_id: Number(sort),
          play_trace_id: traceId,
          track_session_id: window.trackSessionId,
          from_type,
          is_reptile: verifyReptile(),
          ua: navigator?.userAgent || '',
          ...rest,
        },
        ctime,
        baseInfo: {
          _app_user_id: getLocalStorage(localKeyUid) || userInfo?.uid,
        },
      })
    },
    [id, chapterId, sort, userInfo?.uid]
  )

  /**记录视频资源耗时 */
  const resourceTimeReport = useCallback(
    (properties: Record<string, any>) => {
      const { ctime, ...rest } = properties
      reportSDK.eventReport({
        event_name: 'm_resource_time',
        sub_event_name: '',
        properties: {
          _scene_name: 'response_time',
          _page_name: '',
          _pre_page_name: '',
          _url: location.href,
          _referrer_url: document.referrer,
          _story_id: id,
          _chap_id: chapterId,
          _chap_order_id: Number(sort),
          track_session_id: window.trackSessionId,
          ...rest,
        },
        ctime,
      })
    },
    [id, chapterId, sort]
  )

  /**记录页面性能 */
  const performanceReport = useCallback(
    (properties: Record<string, any>) => {
      const { subEventName, _page_name, ...rest } = properties
      reportSDK.eventReport({
        event_name: 'm_performance_time',
        sub_event_name: subEventName,
        properties: {
          _scene_name:
            _page_name === 'player' ? 'chap_play_scene' : 'main_scene',
          _page_name,
          _pre_page_name: '',
          _url: location.href,
          _referrer_url: document.referrer,
          _story_id: id,
          _chap_id: chapterId,
          _chap_order_id: Number(sort),
          track_session_id: window.trackSessionId,
          ...rest,
        },
      })
    },
    [id, chapterId, sort]
  )

  /**记录视频资源耗时 */
  const backUpReport = useCallback(
    (properties: Record<string, any>) => {
      let traceId = sessionStorage.getItem(sessionKeyTraceId)
      if (!traceId) {
        traceId = uuidv4()
        sessionStorage.setItem(sessionKeyTraceId, traceId)
      }
      const { ctime, ...rest } = properties
      reportSDK.eventReport({
        event_name: 'm_back_up',
        sub_event_name: '',
        properties: {
          _scene_name: 'back_up',
          _page_name: '',
          _pre_page_name: '',
          _url: location.href,
          _referrer_url: document.referrer,
          _story_id: id,
          _chap_id: chapterId,
          _chap_order_id: Number(sort),
          play_trace_id: traceId,
          track_session_id: window.trackSessionId,
          ...rest,
        },
        ctime,
      })
    },
    [id, chapterId, sort]
  )

  /**记录js下载时长 */
  const performanceScriptReport = useCallback(
    (properties: Record<string, any>) => {
      const { subEventName, _page_name, ...rest } = properties
      reportSDK.eventReport({
        event_name: 'm_script_time',
        sub_event_name: 'script_time',
        properties: {
          _scene_name:
            _page_name === 'player' ? 'chap_play_scene' : 'main_scene',
          _page_name,
          _pre_page_name: '',
          _url: location.href,
          _referrer_url: document.referrer,
          _story_id: id,
          _chap_id: chapterId,
          _chap_order_id: Number(sort),
          track_session_id: window.trackSessionId,
          ...rest,
        },
      })
    },
    [id, chapterId, sort]
  )

  /**
   * 操作事件
   */
  const playEvent = (properties: Record<string, any>) => {
    let traceId = sessionStorage.getItem(sessionKeyTraceId)
    if (!traceId) {
      traceId = uuidv4()
      sessionStorage.setItem(sessionKeyTraceId, traceId)
    }
    const { subEventName, ctime, ...rest } = properties
    reportSDK.eventReport({
      event_name: 'm_play_event',
      sub_event_name: subEventName,
      properties: {
        _scene_name: 'chap_play_scene',
        _page_name: 'player',
        _pre_page_name: '',
        _story_id: id,
        t_book_id: id,
        _chap_id: chapterId,
        _chap_order_id: Number(sort),
        chap_total_duration: duration,
        video_id: videoId,
        _url: location.href,
        shelf_id: window.shelf_id,
        video_type: videoType,
        video_clarity: dpi,
        play_trace_id: traceId,
        action_ts: Date.now(),
        is_reptile: verifyReptile(),
        ua: navigator?.userAgent || '',
        track_session_id: window.trackSessionId,
        ...rest,
      },
      ctime,
      baseInfo: {
        _app_user_id: getLocalStorage(localKeyUid) || userInfo?.uid,
      },
    })
  }

  const customEventReport = useCallback(
    (subEventName: string, properties: Record<string, any> = {}) => {
      reportSDK.eventReport({
        event_name: 'm_custom_event',
        sub_event_name: subEventName,
        properties: {
          _scene_name: 'chap_play_scene',
          _page_name: 'player',
          _chap_id: currentChapter?.chapter_id,
          _chap_order_id: Number(currentChapter?.serial_number),
          _story_id: id,
          t_book_id: currentChapter?.t_book_id || '',
          _url: location.href,
          ...properties,
        },
      })
    },
    [id, currentChapter]
  )

  const currencyChangeReport = useCallback(
    (properties: Record<string, any>) => {
      reportSDK.eventReport({
        event_name: 'm_currency_change',
        sub_event_name: '',
        properties: {
          _scene_name: 'chap_play_scene',
          _page_name: 'player',
          ...properties,
          _story_id: id,
          _chap_id: chapterId,
          _chap_order_id: Number(sort),
          ...properties,
        },
      })
    },
    [id, chapterId, sort]
  )

  /**
   * 用户登录、注册 上报
   * */
  const userLoginReport = useCallback(
    (data: { eventName: 'signup' | 'signin'; other?: any }) => {
      const { eventName, other = {} } = data

      const params = {
        event_name: 'm_user_signin',
        sub_event_name: eventName,
        properties: {
          _app_account_bindtype: 'vistor', // TODO???
          _vc_stock: { vc_01: 100, vc_02: 50 }, // TODO???
          _url: location.href,
          _chap_id: chapterId,
          _story_id: id,
          _referrer_url: document.referrer,

          ...other,
        },
      }
      reportSDK.eventReport(params)
    },
    [id, chapterId]
  )

  /**
   * 用户绑定账号
   * */
  const userBindAccountReport = (properties: {
    _action: 'start' | 'complete'
    _app_account_bindtype: string // TDOD:fb, apple, google, etc.??
  }) => {
    const position = getCookie(LOGIN_POSITION) //  "pay_login_popup"(充值后提示)/"banner"(网站页面头部)   # 触发登录的位置

    const params = {
      event_name: 'm_bindaccount',
      sub_event_name: 'binding',
      properties: {
        _scene_name: 'chap_play_scene',
        _page_name: 'player',
        position,
        ...properties,
      },
    }
    reportSDK.eventReport(params)
  }

  /**
   * 登录弹窗展示与点击上报
   */
  const userLoginGuidePopupReport = (properties: {
    _action: 'show' | 'guide_click' | 'close' //# 对应操作分别是：弹窗弹出、点击跳第三方账号登录按钮、关闭弹窗(关闭)
  }) => {
    const position = getCookie(LOGIN_POSITION) //  "pay_login_popup"(充值后提示)/"banner"(网站页面头部)   # 触发登录的位置

    const params = {
      event_name: 'm_custom_event',
      sub_event_name: 'login_guide_popup',
      properties: {
        _scene_name: 'chap_play_scene',
        _page_name: 'player',
        position,
        ...properties,
      },
    }
    reportSDK.eventReport(params)
  }

  /**
   * 资产检测弹窗展示与点击上报
   */
  const userLoginInformationPopupReport = (properties: {
    _action: 'show' | 'return_click' | 'continue_click' //"show"(弹窗弹出)/"return_click(点击不进行登录，保持游客，点击确认)"/"continue_click"(点击继续登录三方账号，点击确认),
    previous_account: number //# 之前账号对应的uuid  （所有action，均报三方账号）
  }) => {
    const params = {
      event_name: 'm_custom_event',
      sub_event_name: 'login_information_popup',
      properties: {
        _scene_name: 'chap_play_scene',
        _page_name: 'player',
        ...properties,
      },
    }
    reportSDK.eventReport(params)
  }

  /** 章节解锁 */
  const checkpointUnlockReport = useCallback(
    (properties: Record<string, any>) => {
      reportSDK.eventReport({
        event_name: 'm_checkpoint_unlock',
        sub_event_name: '',
        properties: {
          _story_id: id,
          unlock_type: 1,
          ...properties,
        },
      })
    },
    [id]
  )

  /**
   * 登录弹窗展示与点击上报
   */
  const appDownloadReport = useCallback(
    (properties: { _action: 'show' | 'click' | 'close' }) => {
      const params = {
        event_name: 'm_custom_event',
        sub_event_name: 'app_download_popup',
        properties: {
          _scene_name: 'chap_play_scene',
          _page_name: 'player',
          _story_id: id,
          _chap_id: chapterId,
          _chap_order_id: Number(sort),
          popup_type: 2,
          ...properties,
        },
      }
      reportSDK.eventReport(params)
    },
    [id, chapterId, sort]
  )

  /** 播控条展示上报 */
  const playerToolReport = useCallback(
    (properties: { _action: 'show' }) => {
      reportSDK.eventReport({
        event_name: 'm_custom_event',
        sub_event_name: 'player_tool_click',
        properties: {
          _story_id: id,
          _chap_id: chapterId,
          _chap_order_id: Number(sort),
          ...properties,
        },
      })
    },
    [id, chapterId, sort]
  )

  /**
   * hall banner展示与点击上报
   */
  const userHallBannerReport = (properties: {
    _action: 'show' | 'click'
    iad_id: number
    iad_lang: string
    iad_info: Record<string, any>
    shelf_id: number
  }) => {
    const params = {
      event_name: 'm_custom_event',
      sub_event_name: 'iad_track_stat',
      properties: {
        _scene_name: 'main_scene',
        _page_name: 'home',
        ...properties,
      },
    }
    reportSDK.eventReport(params)
  }

  /**
   * hall book 展示与点击上报
   */
  const userHallBookReport = (properties: {
    item_list: string[]
    _page_name: string
  }) => {
    const params = {
      event_name: 'm_item_pv',
      sub_event_name: '',
      properties: {
        _scene_name: 'main_scene',
        _item_type: 'cover',
        ...properties,
      },
    }
    reportSDK.eventReport(params)
  }

  /**
   * pwa展示或安装事件
   * */
  const pwaGuideReport = (properties: {
    _action: 'show' | 'add_click' | 'install_click' | 'install_done'
    sub_event_name?: 'pwa_guide_click' | 'pwa_install_click'
  }) => {
    const { sub_event_name = 'pwa_install_click', ...rest } = properties
    const params = {
      event_name: 'm_custom_event',
      sub_event_name,
      properties: {
        _scene_name: 'main_scene',
        _page_name: 'home',
        user_agent: navigator.userAgent,
        ...rest,
      },
    }
    reportSDK.eventReport(params)
  }

  /** 快捷支付面板中支付方式选择区域展示和点击时上报 */
  const reportPayChannelChooseStat = (properties: {
    _action: 'show' | 'click' | 'more_click'
    show_list?: any
    pay_channel?: any
    pay_channel_sub_class?: number
    channel_sku?: string
  }) => {
    const params = {
      event_name: 'm_custom_event',
      sub_event_name: 'pay_channel_choose_stat',
      properties: {
        _scene_name: 'chap_play_scene',
        _page_name: 'player',
        ...properties,
      },
    }
    reportSDK.eventReport(params)
  }

  /** 页面按钮点击事件 */
  const pageClickReport = (properties: {
    _page_name: string
    _element_name: 'avatar' | 'profile_history' | 'watch_now'
  }) => {
    const params = {
      event_name: 'm_widget_click',
      sub_event_name: '',
      properties: {
        _scene_name: 'main_scene',
        _url: location.href,
        ...properties,
      },
    }
    reportSDK.eventReport(params)
  }

  return {
    pwaGuideReport,
    reportHeart,
    payReport,
    pageEnter,
    playEvent,
    currencyChangeReport,
    customEventReport,
    userLoginReport,
    userBindAccountReport,
    userLoginGuidePopupReport,
    userLoginInformationPopupReport,
    checkpointUnlockReport,
    appDownloadReport,
    playerToolReport,
    resourceTimeReport,
    backUpReport,
    performanceReport,
    userHallBannerReport,
    userHallBookReport,
    performanceScriptReport,
    reportPayChannelChooseStat,
    pageClickReport,
  }
}
