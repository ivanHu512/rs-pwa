import { create } from "zustand";
import { StoreApi, UseBoundStore } from "zustand";

import { cookieSet, LOGIN_POSITION } from "@/lib/cookies";
import { UserInfo } from "@/types/drama";

type WithSelectors<S> = S extends { getState: () => infer T }
  ? S & { use: { [K in keyof T]: () => T[K] } }
  : never;

const createSelectors = <S extends UseBoundStore<StoreApi<object>>>(
  _store: S,
) => {
  const store = _store as WithSelectors<typeof _store>;
  store.use = {};
  for (const k of Object.keys(store.getState())) {
    (store.use as any)[k] = () => store((s) => s[k as keyof typeof s]);
  }

  return store;
};

// State
type State = {
  /** 是否加载sdk */
  loadVisible: boolean;
  openUserInfoBubble: boolean;
  /** 登陆弹框是否开启 */
  openLoginModal: boolean;
  /** 选择登陆用户弹框是否开启 */
  openSelectUserModal: boolean;
  /** 登陆后用户信息（非当前用户） */
  loginUserInfo: UserInfo;
};

type SetOpenLoginModal = {
  (openLoginModal: true, position: "pay_login_popup" | "banner"): void;
  (openLoginModal: false, position?: "pay_login_popup" | "banner"): void;
};

// Actions
type LoginStore = State & {
  setOpenLoginModal: SetOpenLoginModal;
  setOpenSelectUserModal: (openSelectUserModal: boolean) => void;
  setLoginUserInfo: (loginUserInfo: any) => void;
  setOpenUserInfoBubble: (openUserInfoBubble: boolean) => void;
  setLoadVisible: (loadVisible: boolean) => void;
};

// Initial state
export const useLogin = create<LoginStore>((set) => ({
  loadVisible: false,
  openUserInfoBubble: false,
  openLoginModal: false,
  openSelectUserModal: false,
  loginUserInfo: {},
  setLoadVisible: (loadVisible: boolean) => set({ loadVisible }),
  setOpenLoginModal: (openLoginModal: boolean, position?: string) => {
    if (position) cookieSet(LOGIN_POSITION, position, 365);
    set({ openLoginModal });
  },
  setOpenSelectUserModal: (openSelectUserModal: boolean) =>
    set({ openSelectUserModal }),
  setLoginUserInfo: (loginUserInfo: any) => set({ loginUserInfo }),
  setOpenUserInfoBubble: (openUserInfoBubble: any) =>
    set({ openUserInfoBubble }),
}));

export const useLoginStore = createSelectors(useLogin);
