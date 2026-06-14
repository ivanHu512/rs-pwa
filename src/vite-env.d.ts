/// <reference types="vite/client" />
import type { TTMinisInstance } from "./lib/minisApi/types";

declare global {
  interface Window {
    TTMinis?: TTMinisInstance;
    AppleID: {
      auth: {
        init: (config: {
          clientId?: string;
          scope?: string;
          redirectURI?: string;
          state?: string;
          redirect?: boolean;
          usePopup?: boolean;
        }) => void;
        signIn: (config?: { state?: string }) => Promise<unknown>;
      };
    };
    FB: {
      init: (config: {
        appId: string;
        cookie?: boolean;
        xfbml?: boolean;
        version?: string;
      }) => void;
      getLoginStatus: (callback: (response: any) => void) => void;
      api: (
        path: string,
        params: Record<string, any>,
        callback: (response: any) => void
      ) => void;
    };
    fbAsyncInit?: () => void;
    $video?: unknown;
    __REPORT_TRACK_SESSION_ID__?: string;
    __REPORT_PLAY_TRACE_ID__?: string;
    __REPORT_PREVIOUS_PAGE_NAME__?: string;
    __REPORT_CURRENT_PRE_PAGE_NAME__?: string;
    __REPORT_PLAYER_PRE_PAGE_NAME__?: string;
    charge?: {
      page_trace_id: string;
      time: number;
    };
    shelf_id?: number;
    routerTime?: number;
    trackSessionId?: string;
    variantPlayer?:string;
    language?: string;
  }

  interface ImportMetaEnv {
    readonly VITE_API_LOG_DOMAIN?: string;
    readonly VITE_APP_ENV?: "test" | "gray" | "prod";
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  /** 视频资源 */
  namespace Book {
    type TDefinition = 360 | 540 | 720 | 1080;

    type TDefinitionStr = "360P" | "540P" | "720P" | "1080P";

    interface IPlayInfo {
      PlayURL: string;
      Encode: "H264" | "H265";
      Dpi: TDefinition;
    }

    interface IPlayItem {
      url: string;
      definition: Book.TDefinitionStr;
      dpi: TDefinition;
    }
  }

  namespace API {
    type Response<T = Record<string, any>> = {
      code?: number;
      data?: T;
      msg?: string;
      message?: string;
      server_time?: number;
      service_time?: number;
    };
  }

  interface NavigatorWithConnection extends Navigator {
    connection?: {
      downlink: number;
      effectiveType: string;
      rtt: number;
      saveData: boolean;
    };
  }
}

export {};
