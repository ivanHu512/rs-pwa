import { getEnv } from "@cmsfe/tools/env";
import { aesDescryptResponse, createSign } from "@cmsfe/tools/service";
import { v4 as uuidv4 } from "uuid";

import {
  API_VERSION,
  CLIENT_VER,
  languageKey,
  localKeyDevId,
  localKeyUid,
  sessionKey,
} from "@/lib/constant";
import { getSiteConfigClient } from "@/lib/config/site";
import { cookieSet, COOKIE_KEY_UID, COOKIE_KEY_DEVID } from "@/lib/cookies";
import { isJSON } from "@/lib/utils";
import { reloadPage } from "@/lib";
import { getLocalStorage, setLocalStorage } from "./storageUtils";

const API_DOMAIN = import.meta.env.VITE_API_DOMAIN;

function resolveRequestUrl(url: string) {
  if (/^(https?:)?\/\//i.test(url) || !API_DOMAIN) {
    return url;
  }

  return `${API_DOMAIN.replace(/\/$/, "")}/${url.replace(/^\//, "")}`;
}

function getPlatform() {
  const env = getEnv();
  if (env.isAndroid) {
    return 1;
  }
  if (env.isIOS) {
    return 2;
  }
  return 3;
}

export async function requestWithSign<T>(
  url: string,
  uid: number,
  local: string,
  data: Record<string, any> = {},
): Promise<T> {
  try {
    let devId = getLocalStorage(localKeyDevId);
    if (!devId) {
      devId = uuidv4();
      setLocalStorage(localKeyDevId, devId);
    }

    const session = getLocalStorage(sessionKey);

    // 同步到 cookie
    cookieSet(COOKIE_KEY_DEVID, devId);
    cookieSet(COOKIE_KEY_UID, String(uid || 0));
    if (session) {
      cookieSet(sessionKey, session);
    }

    const header: any = {
      devId,
      session,
      channelId: getSiteConfigClient()?.channelId,
      apiVersion: API_VERSION,
      lang: local || "en",
      clientVer: CLIENT_VER,
      "h5-platform": getPlatform(),
      uid: uid,
      ts: Math.floor(Date.now() / 1000),
    };

    const sign = createSign({
      ...header,
      ...data,
    });

    const response = await fetch(resolveRequestUrl(url), {
      method: "POST",
      headers: {
        timeout: 5000,
        "Content-Type": "application/json",
        ...header,
        sign,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    if (isJSON(responseText)) {
      return JSON.parse(responseText);
    } else {
      return aesDescryptResponse(responseText);
    }
  } catch (error) {
    // 错误处理
    console.error("Fetch error:", error);
    throw error;
  }
}

export async function requestH5DramaSign<T>(
  url: string,
  data: Record<string, any> = {},
  options?: { signal?: AbortSignal },
): Promise<T | undefined> {
  try {
    let devId = getLocalStorage(localKeyDevId);
    const uId = getLocalStorage(localKeyUid);
    const session = getLocalStorage(sessionKey);
    if (!devId) {
      devId = uuidv4();
      setLocalStorage(localKeyDevId, devId);
    }

    const language = getLocalStorage(languageKey) || "en";
    // 同步到 cookie
    cookieSet(COOKIE_KEY_DEVID, devId);
    cookieSet(COOKIE_KEY_UID, String(uId || 0));
    if (session) {
      cookieSet(sessionKey, session);
    }
    const header: any = {
      devId,
      session,
      channelId: getSiteConfigClient()?.channelId,
      apiVersion: API_VERSION,
      lang: language,
      clientVer: CLIENT_VER,
      "h5-platform": getPlatform(),
      uid: uId || 0,
      ts: Math.floor(Date.now() / 1000),
    };

    const sign = createSign({
      ...header,
      ...data,
    });

    const response = await fetch(resolveRequestUrl(url), {
      method: "POST",
      headers: {
        timeout: 5000,
        "Content-Type": "application/json",
        ...header,
        sign,
      },
      body: JSON.stringify(data),
      signal: options?.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const responseText = await response.text();

    if (isJSON(responseText)) {
      const jsonText = JSON.parse(responseText);
      console.log("结果", jsonText.code);
      if (jsonText?.code === 101 || jsonText?.code === 103) {
        reloadPage(2);
        return;
      }
      return JSON.parse(responseText);
    } else {
      return aesDescryptResponse(responseText);
    }
  } catch (error: any) {
    // 错误处理
    console.log("Fetch error:", error);
    if (error.name !== "AbortError") {
      throw error;
    }
    return undefined;
  }
}
