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
import cssnano from "cssnano";

const IS_DEV = process.argv.includes("--dev");

const esbuildBaseOptions = {
  bundle: true,
  minify: !IS_DEV,
};

function getPostcssPlugins(
  tailwindConfig: tailwind.Config,
  minifyCss: boolean = true,
) {
  return [
    tailwind(tailwindConfig),
    autoprefixer,
    ...(!IS_DEV && minifyCss ? [cssnano()] : []),
  ];
}

async function copyManifest() {
  const manifestSrcPath = "./src";
  const manifestSrcFiles = ["manifest.json", "icon.png", "block_rules.json"];

  const copy = () =>
    Promise.all(
      manifestSrcFiles.map((srcFile) =>
        copyFile(`${manifestSrcPath}/${srcFile}`, `./dist/${srcFile}`),
      ),
    );

  if (IS_DEV) {
    await copy();

    chokidar
      .watch(`${manifestSrcPath}/{${manifestSrcFiles.join(",")}}`)
      .on("change", copy);

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
    ...esbuildBaseOptions,
    entryPoints: ["./src/content/index.tsx"],
    outfile: "./dist/content.js",
    plugins: [
      inline({
        filter: /^tailwind:/,
        transform: (content) =>
          postcss(getPostcssPlugins(tailwindConfig))
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
    return postcss(getPostcssPlugins(tailwindConfig, false))
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
    ...esbuildBaseOptions,
    entryPoints: ["./src/options/index.tsx"],
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

  const htmlSrcPath = "./src/options";
  const htmlSrcFiles = ["index.html", "favicon.ico"];

  const copyHtml = () =>
    Promise.all(
      htmlSrcFiles.map((htmlSrcFile) =>
        copyFile(
          `${htmlSrcPath}/${htmlSrcFile}`,
          `./dist/${
            htmlSrcFile === htmlSrcFiles[0] ? "options.html" : htmlSrcFile
          }`,
        ),
      ),
    );

  if (IS_DEV) {
    const [esbuildContext] = await Promise.all([
      esbuild.context(esbuildOptions),
      copyHtml(),
    ]);

    esbuildContext.watch();
    chokidar
      .watch(`${htmlSrcPath}/{${htmlSrcFiles.join(",")}}`)
      .on("change", copyHtml);

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
