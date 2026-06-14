# mini-delivery-drama-web

**TikTok Minis** 前端 Web 应用，基于 Vite，使用 React 18、TypeScript 与 React Router。

## 技术栈

- [Vite 4](https://vitejs.dev/) + [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [React Router 6](https://reactrouter.com/)（`createBrowserRouter`）
- [ESLint 8](https://eslint.org/)（TypeScript、React Hooks、React Refresh）
- [@vitejs/plugin-legacy](https://github.com/vitejs/vite/tree/main/packages/plugin-legacy)：生产构建面向较低版本浏览器输出 legacy 分包与 polyfill

## 环境要求

- **Node.js**：`>= 16.14.0`（见 `package.json` 的 `engines`）
- 建议使用 **Node 18+** 进行开发：部分开发依赖（如 `@typescript-eslint` 7）在官方 `engines` 中声明为 Node 18+，在 Node 16 上可能仅出现安装告警，一般仍可运行；若遇问题请升级 Node。

## 快速开始

```bash
pnpm install
npm run dev
```

浏览器访问：**http://localhost:4007**（端口在 `vite.config.ts` 中固定为 `4007`，且 `strictPort: true`，端口被占用时会直接失败）。

## 常用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 生产构建，输出到 `dist/` |
| `npm run preview` | 本地预览构建结果（默认同样使用端口 `4007`） |
| `npm run lint` | ESLint 检查 |
| `npm run lint:fix` | ESLint 自动修复可修复项 |

## 目录结构（简要）

```
src/
  main.tsx              # 应用入口
  router.tsx            # 路由定义
  index.css             # 全局样式
  layouts/RootLayout.tsx   # 根布局（含底部导航）
  pages/                # 页面
    HomePage/
    AboutPage.tsx
    DramaPage/          # 示例：/drama/:id
    NotFoundPage.tsx
```

路径别名：`@/` 指向 `src/`（见 `vite.config.ts`）。

## 路由说明

| 路径 | 页面 |
|------|------|
| `/` | 首页 |
| `/about` | 关于 |
| `/drama/:id` | 剧目详情（通过 `useParams` 读取 `id`） |
| 其他 | 404 |

当前为 **History 模式**。将 `dist` 部署到静态服务器时，需要将所有文档请求回退到 `index.html`（例如 Nginx 的 `try_files`），否则刷新子路径会 404。

## 构建与浏览器兼容

- `package.json` 中的 **browserslist** 与 `vite.config.ts` 里 **legacy.targets** 共同约束兼容范围（如较旧的 Chrome / Android WebView / iOS Safari）。
- 生产构建会生成 **现代包** 与 **legacy 包**（含 polyfill），体积会大于纯现代构建。
- **React 18 不支持 IE 11**；若必须支持 IE，需要另行评估技术方案。

## 代码规范

配置见项目根目录 **`.eslintrc.cjs`**。提交前建议执行 `npm run lint`。

## 许可证

私有项目（`package.json` 中 `"private": true`）。


// 埋点
// arms
// 多语言
