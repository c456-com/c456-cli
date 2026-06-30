#!/usr/bin/env node

import esbuild from "esbuild";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "..");

async function build() {
  await esbuild.build({
    entryPoints: [join(rootDir, "src", "index.js")],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    outfile: join(rootDir, "dist", "index.js"),
    // @inquirer/prompts 链上有 yoctocolors-cjs 等 CJS，bundle 进 ESM 单文件会触发
    // 「Dynamic require of "node:tty" is not supported」；与 Node 版本无关，勿打入 bundle。
    external: [
      "commander",
      "open",
      "cfonts",
      "playwright-core",
      "@inquirer/prompts",
    ], // cfonts 为独立包（许可证见 node_modules/cfonts）
    minify: false,
    sourcemap: false,
  });

  console.log("✅ Build successful: dist/index.js");
}

build().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
