import { useLocale } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/shallow'

import { requestH5DramaSign } from '@/lib/request'
import { useDramaStore } from '@/stores/drama-store'
interface IProps {
  api: string
  params?: any
  manual?: boolean
  onSuccess?: (res: any, params?: any) => void
  onError?: (error: any, params?: any) => void
  dep?: any[]
}

export function useRsRequest(props: IProps) {
  const {
    api,
    params = {},
    onSuccess,
    onError,
    manual = false,
    dep = [],
  } = props
  const [data, setData] = useState<any>(null)
  const local = useLocale()

  const { userInfo } = useDramaStore(
    useShallow((state) => ({
      userInfo: state.userInfo,
    }))
  )
  const run = useCallback(async () => {
    const uid = userInfo?.uid

    if (!uid) {
      return
    }
    try {
      const res = await requestH5DramaSign(api, uid, local, params)
      onSuccess && onSuccess(res)
      setData(res)
    } catch (e) {
      onError && onError(e, params)
    }
  }, [local, userInfo?.uid])

  useEffect(() => {
    if (!manual) {
      run()
    }
  }, [run, manual, ...dep])

  return {
    data,
    run,
  }
}
