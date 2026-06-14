import React from "react";
import { create } from "zustand";
import { StoreApi, UseBoundStore } from "zustand";

import { ExposeRef,UserInfo } from "@/types/drama";

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

type State = {
  online: boolean;
  swiperRef: React.RefObject<ExposeRef> | null;
  /** 全局video实例引用 */
  globalVideoRef: React.RefObject<HTMLVideoElement> | null;
  /** 当前video实例所在的章节ID */
  currentVideoChapterId: string | number | null;
};

type SwiperStore = State & {
  setOnline: (online: boolean) => void;
  setSwiperRef: (ref: React.RefObject<ExposeRef> | null) => void;
  setGlobalVideoRef: (ref: React.RefObject<HTMLVideoElement> | null) => void;
  setCurrentVideoChapterId: (chapterId: string | number | null) => void;
};

export const useSwiper = create<SwiperStore>((set) => ({
  online: true,
  swiperRef: null,
  globalVideoRef: null,
  currentVideoChapterId: null,
  setOnline: (online: boolean) => set({ online }),
  setSwiperRef: (ref: React.RefObject<ExposeRef> | null) => {
    set({
      swiperRef: ref,
    });
  },
  setGlobalVideoRef: (ref: React.RefObject<HTMLVideoElement> | null) => {
    set({
      globalVideoRef: ref,
    });
  },
  setCurrentVideoChapterId: (chapterId: string | number | null) => {
    set({
      currentVideoChapterId: chapterId,
    });
  },
}));

export const useSwiperStore = createSelectors(useSwiper);
