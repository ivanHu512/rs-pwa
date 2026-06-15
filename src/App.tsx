// import { useEffect } from "react";
import { AliveScope } from "react-activation";
import { RouterProvider } from "react-router-dom";
// import { useDramaStore } from "@/stores/drama-store";
import { router } from "./router";

export function App() {
  // const userInfo = useDramaStore.use.userInfo();

  // useEffect(() => {
  //   if (!userInfo?.uid) {
  //     return;
  //   }
  //   try {
  //     (
  //       armsRum as unknown as {
  //         setConfig?: (key: string, value: Record<string, unknown>) => void;
  //       }
  //     ).setConfig?.("user", {
  //       name: String(userInfo.uid),
  //     });
  //     emitReportCacheHandle();
  //   } catch (error) {
  //     console.error("[arms] set user failed", error);
  //   }
  // }, [userInfo?.uid]);

  return (
    <AliveScope>
      <RouterProvider router={router} />
    </AliveScope>
  );
}
