import type { ICore, ApplePay, GooglePay } from '@adyen/adyen-web'
import { create } from 'zustand'

import { localKeyProduct } from '@/lib/constant'
import {
  IProduct,
  PayerMax,
  PayMethodsResponseData,
  PaySuccessInfo,
} from '@/types'

type DiscountPopInfo = {
  close_unlock_panel?: any
  exit_player?: any
  sub_success_popup?: any
}

type State = {
  openPayModal: boolean
  //adyen checkout 实例
  adyenCheckout: ICore | null
  adyenMethods?: PayMethodsResponseData
  itemInfo: IProduct | undefined
  isLoading: boolean
  isOpenAdyenModal: boolean
  isOpenFailModal: boolean
  isOpenIapSuccess: boolean

  isOpenMethodModal: boolean
  paySuccessInfo: PaySuccessInfo | null

  selectedMethod: {
    type: string
    icon?: string
  } | null

  openRetentionModal: {
    open: boolean
    pos: number
    product?: IProduct
    next?: () => void
  }

  vipSuccessModal: {
    open: boolean
    type: number
  }

  /** 挽留折扣商品 */
  discountPopupInfo?: DiscountPopInfo
  payerMaxData: PayerMax | null
  applePayInstance: ApplePay | null
  googlePayInstance: GooglePay | null
}

type Action = {
  setOpenPayModal: (openPayModal: boolean) => void
  setAdyenCheckout: (checkout: any) => void
  setAdyenMethods: (data: any) => void
  setItemInfo: (data: IProduct) => void
  setGlobalLoading: (isLoading: boolean) => void
  setOpenAdyenModal: (open: boolean) => void
  setOpenFailModal: (open: boolean) => void
  setOpenIapSuccess: (open: boolean) => void

  setOpenMethodModal: (open: boolean) => void
  closeAllPayModal: () => void
  setPaySuccessInfo: (paySuccessInfo: PaySuccessInfo) => void

  setVipSuccessModal: (payload: Partial<State['vipSuccessModal']>) => void
  setOpenRetentionModal: (payload: Partial<State['openRetentionModal']>) => void
  setDiscountPopupInfo: (info: DiscountPopInfo) => void

  setSelectedMethod: (selectedMethod: State['selectedMethod']) => void
  setPayerMaxData: (data: PayerMax) => void
  setApplePayInstance: (ref: ApplePay | null) => void
  setGooglePayInstance: (ref: GooglePay | null) => void
}

export const useCheckoutStore = create<State & Action>((set) => ({
  paySuccessInfo: null,
  openPayModal: false,
  adyenCheckout: null,
  itemInfo: undefined,
  isLoading: false,
  isOpenAdyenModal: false,
  isOpenFailModal: false,
  isOpenIapSuccess: false,
  isOpenVipSuccess: false,
  isOpenMethodModal: false,
  popupVipInfo: null,
  selectedMethod: null,
  vipSuccessModal: {
    open: false,
    type: 1,
  },
  discountPopupInfo: undefined,
  payerMaxData: null,
  applePayInstance: null,
  googlePayInstance: null,
  openRetentionModal: {
    open: false,
    pos: 0,
    product: undefined,
    next: undefined,
  },
  setOpenRetentionModal: (payload) =>
    set((state) => ({
      openRetentionModal: {
        ...(state.openRetentionModal || {}),
        ...payload,
      },
    })),
  setOpenMethodModal: (isOpenMethodModal) => set({ isOpenMethodModal }),
  setOpenPayModal: (openPayModal: boolean) => set({ openPayModal }),
  setAdyenCheckout: (adyenCheckout) => set({ adyenCheckout }),
  setAdyenMethods: (adyenMethods) => set({ adyenMethods }),
  setItemInfo: (itemInfo) =>
    set(() => {
      localStorage.setItem(localKeyProduct, JSON.stringify(itemInfo))
      return { itemInfo }
    }),
  setGlobalLoading: (isLoading) => set({ isLoading }),
  setOpenAdyenModal: (isOpenAdyenModal) => set({ isOpenAdyenModal }),
  setOpenFailModal: (isOpenFailModal) =>
    set({ isOpenFailModal, isLoading: false }),
  setOpenIapSuccess: (isOpenIapSuccess) =>
    set({ isOpenIapSuccess, isLoading: false }),

  setPaySuccessInfo: (paySuccessInfo) => set({ paySuccessInfo }),

  setVipSuccessModal: (payload) =>
    set((state) => ({
      vipSuccessModal: {
        ...state.vipSuccessModal,
        ...payload,
      },
      isLoading: false,
    })),
  closeAllPayModal: () =>
    set({
      openPayModal: false,
      isOpenMethodModal: false,
      isOpenAdyenModal: false,
    }),
  setDiscountPopupInfo: (discountPopupInfo) => set({ discountPopupInfo }),
  setSelectedMethod: (selectedMethod) => set({ selectedMethod }),
  setPayerMaxData: (payerMaxData) => set({ payerMaxData }),
  setApplePayInstance: (applePayInstance) => set({ applePayInstance }),
  setGooglePayInstance: (googlePayInstance) => set({ googlePayInstance }),
}))
