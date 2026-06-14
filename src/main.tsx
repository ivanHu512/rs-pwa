import { createRoot } from "react-dom/client";
import { App } from "./App";
// import { reportAppInstallIfNeeded } from "./hooks/useReport";
import { I18nProvider } from "./i18n/provider";
// import "./lib/arms";
import "@/styles/index.css";

// 仅在 dev / test 环境挂载 vConsole，production 不引入
if (import.meta.env.MODE !== "production") {
  import("vconsole").then(({ default: VConsole }) => {
    new VConsole();
  });
}

// reportAppInstallIfNeeded();

createRoot(document.getElementById("root")!).render(
  <I18nProvider>
    <App />
  </I18nProvider>,
);
