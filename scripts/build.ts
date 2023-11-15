import * as esbuild from "esbuild";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import inline from "esbuild-plugin-inline-import";
import postcss from "postcss";
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import tailwindBaseConfig from "../tailwind.config";
import { deleteAsync } from "del";
import chokidar from "chokidar";
import style from "esbuild-style-plugin";

const IS_DEV = process.argv.includes("--dev");

async function copyManifest() {
  const manifestSrcPath = "./src/manifest.json";

  const copy = () => copyFile(manifestSrcPath, "./dist/manifest.json");

  if (IS_DEV) {
    await copy();

    chokidar.watch(manifestSrcPath).on("change", copy);

    return;
  }

  return copy();
}

async function buildContent() {
  const tailwindConfig = {
    ...tailwindBaseConfig,
    content: [...tailwindBaseConfig.content, `./src/content/**/*.{ts,tsx}`],
    corePlugins: {
      preflight: false,
    },
  };

  const esbuildOptions = {
    entryPoints: ["./src/content/index.tsx"],
    bundle: true,
    outfile: "./dist/content.js",
    plugins: [
      inline({
        filter: /^tailwind:/,
        transform: (content) =>
          postcss(tailwind(tailwindConfig), autoprefixer)
            .process(content, { from: undefined })
            .then((result) => result.css)
            .catch((error) => {
              console.error(error.message);
              return "";
            }),
      }),
    ],
  };

  const cssSrcPath = "./src/content/index.css";

  const buildCss = async () => {
    return postcss(tailwind(tailwindConfig), autoprefixer)
      .process(await readFile(cssSrcPath), {
        from: undefined,
      })
      .then((result) => writeFile("./dist/content.css", result.css))
      .catch((error) => console.error(error.message));
  };

  if (IS_DEV) {
    const [esbuildContext] = await Promise.all([
      esbuild.context(esbuildOptions),
      buildCss(),
    ]);

    esbuildContext.watch();
    chokidar.watch(cssSrcPath).on("change", buildCss);

    return;
  }

  return Promise.all([esbuild.build(esbuildOptions), buildCss()]);
}

async function buildOptions() {
  const esbuildOptions = {
    entryPoints: ["./src/options/index.tsx"],
    bundle: true,
    outfile: "./dist/options.js",
    plugins: [
      style({
        postcss: {
          plugins: [
            tailwind({
              ...tailwindBaseConfig,
              content: [
                ...tailwindBaseConfig.content,
                `./src/options/**/*.{ts,tsx}`,
              ],
            }),
            autoprefixer,
          ],
        },
      }),
    ],
  };

  const htmlSrcPath = "./src/options/index.html";

  const copyHtml = () => copyFile(htmlSrcPath, "./dist/options.html");

  if (IS_DEV) {
    const [esbuildContext] = await Promise.all([
      esbuild.context(esbuildOptions),
      copyHtml(),
    ]);

    esbuildContext.watch();
    chokidar.watch(htmlSrcPath).on("change", copyHtml);

    return;
  }

  return Promise.all([esbuild.build(esbuildOptions), copyHtml()]);
}

(async () => {
  try {
    await deleteAsync("./dist");

    await mkdir("./dist");

    await Promise.all([copyManifest(), buildContent(), buildOptions()]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
