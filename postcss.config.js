import path from "node:path";
import { fileURLToPath } from "node:url";
import autoprefixer from "autoprefixer";
import postcssRtlcss from "postcss-rtlcss";
import tailwindcss from "tailwindcss";
import pxToRem from "postcss-pxtorem";

const configDir = path.dirname(fileURLToPath(import.meta.url));

export default {
  plugins: [
    tailwindcss({ config: path.join(configDir, "tailwind.config.mjs") }),
    postcssRtlcss({
      safeBothPrefix: true,
      processKeyFrames: true,
      processUrls: true,
    }),
    pxToRem({
      rootValue: 16,
      propList: ["*"],
      exclude: /node_modules/i,
    }),
    autoprefixer(),
  ],
};
