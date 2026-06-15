import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    // 与配置文件同目录，避免从其它 cwd 启动时找不到 index.html / postcss.config
    root: path.resolve(__dirname),
    css: {
      // 显式指定 postcss-load-config 的搜索目录（默认同 config.root，此处与 vite 配置目录对齐）
      postcss: path.resolve(__dirname),
    },
    plugins: [
      react(),
      legacy({
        // 与 package.json 的 browserslist 对齐：旧版 Android WebView / iOS Safari 等
        targets: [
          "Chrome >= 49",
          "Android >= 5",
          "iOS >= 10",
          "Safari >= 10",
          "defaults",
        ],
        modernPolyfills: true,
        renderLegacyChunks: true,
      }),
      // {
      //   name: "ensure-sdk-first",
      //   enforce: "post",
      //   transformIndexHtml(html) {
      //     const sdkTag =
      //       /<script src="https:\/\/connect\.tiktok-minis\.com\/drama\/sdk\.js"><\/script>/;
      //     const tags = html.match(sdkTag);
      //     if (tags) {
      //       const removed = html.replace(sdkTag, "");
      //       return removed.replace("<head>", `<head>\n    ${tags[0]}`);
      //     }
      //     return html;
      //   },
      // },
    ],
    server: {
      host: "0.0.0.0",
      port: 4007,
      strictPort: true,
    },
    preview: {
      port: 4007,
      strictPort: true,
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      // 语法目标由 @vitejs/plugin-legacy 的 targets 决定；此处仅约束 CSS 降级范围
      cssTarget: "chrome61",
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2015"
      },
    },
  };
});
