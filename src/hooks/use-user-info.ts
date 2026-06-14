import { useShallow } from 'zustand/shallow'
import { servicesGetUserInfo } from '@/lib/services/login'
import { useDramaStore } from '@/stores/drama-store'

export function useUserInfo() {
  const { setUserInfo } = useDramaStore(
    useShallow((state) => ({
      setUserInfo: state.setUserInfo,
    }))
  )

  const getUserInfo = async (uid: string | number, session: string) => {
    try {
      const result = await servicesGetUserInfo(Number(uid))
      if (result?.code === 0 && result?.data?.user_info) {
        setUserInfo(
          {
            ...result?.data?.user_info,
            subscribe_entrance: result?.data?.subscribe_entrance,
          },
          session
        )
      }
    } catch (error) {
      console.warn(error)
    }
  }

  return { getUserInfo }
}
