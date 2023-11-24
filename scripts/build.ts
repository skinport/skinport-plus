import * as esbuild from "esbuild";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import esbuildInline from "esbuild-plugin-inline-import";
import postcss from "postcss";
import { mkdir, cp, rm } from "node:fs/promises";
import tailwindBaseConfig from "../tailwind.config";
import chokidar from "chokidar";
import esbuildStyle from "esbuild-style-plugin";
import path from "node:path";

const IS_DEV = process.argv.includes("--dev");

function getSrcPath(srcPath: string = "") {
  return path.join("./src", srcPath);
}

function getDistPath(distPath: string = "") {
  return path.join("./dist", distPath);
}

async function copySrcFileToDist(srcFile: string) {
  const srcPath = srcFile.startsWith("src") ? srcFile : getSrcPath(srcFile);
  const distPath = getDistPath(srcPath.replace("src", ""));

  await cp(srcPath, distPath, {
    recursive: true,
  });

  console.log("[info] copied", srcPath);
}

function getPostcssPlugins(tailwindContent: string[]) {
  return <postcss.AcceptedPlugin[]>[
    tailwind({
      ...tailwindBaseConfig,
      content: [...tailwindBaseConfig.content, ...tailwindContent],
    }),
    autoprefixer,
  ];
}

async function copyStaticFiles(srcFiles: string[]) {
  await Promise.all(srcFiles.map(copySrcFileToDist));

  if (IS_DEV) {
    chokidar
      .watch(getSrcPath(`{${srcFiles.join(",")}}`))
      .on("change", copySrcFileToDist);
  }
}

async function buildExtensionContext(
  context: string,
  {
    tailwind,
    inlineTailwind,
    entryPointSuffix = "tsx",
  }: {
    tailwind?: boolean;
    inlineTailwind?: boolean;
    entryPointSuffix?: "ts" | "tsx";
  } = {},
) {
  const esbuildOptions: esbuild.BuildOptions & { plugins: esbuild.Plugin[] } = {
    entryPoints: [getSrcPath(`${context}/index.${entryPointSuffix}`)],
    outfile: getDistPath(`${context}/index.js`),
    bundle: true,
    minify: !IS_DEV,
    metafile: true,
    plugins: [],
  };

  if (tailwind) {
    esbuildOptions.plugins.push(
      esbuildStyle({
        postcss: {
          plugins: getPostcssPlugins([getSrcPath(`${context}/**/*.{ts,tsx}`)]),
        },
      }),
    );
  }

  if (inlineTailwind) {
    esbuildOptions.plugins.push(
      esbuildInline({
        filter: /^tailwind:/,
        transform: (content) =>
          postcss(getPostcssPlugins([getSrcPath(`${context}/**/*.{ts,tsx}`)]))
            .process(content, { from: undefined })
            .then((result) => result.css)
            .catch((error) => {
              console.error(error.message);
              return "";
            }),
      }),
    );
  }

  esbuildOptions.plugins.push({
    name: "log",
    setup: (build) => {
      build.onEnd((result) => {
        if (result.metafile?.outputs) {
          Object.keys(result.metafile.outputs).forEach((outputFile) =>
            console.log("[info] compiled", outputFile.replace("dist/", "")),
          );
        }
      });
    },
  });

  const esbuildContext = await esbuild.context(esbuildOptions);

  await esbuildContext.watch();

  if (!IS_DEV) {
    await esbuildContext.dispose();
  }
}

(async () => {
  try {
    await rm(getDistPath(), { recursive: true, force: true });

    await mkdir(getDistPath());

    await Promise.all([
      copyStaticFiles([
        "phishing-blocker/rulesets.json",
        "phishing-blocker/index.html",
        "options/index.html",
        "favicon.ico",
        "manifest.json",
        "icon.png",
        "fonts.css",
      ]),
      buildExtensionContext("background", { entryPointSuffix: "ts" }),
      buildExtensionContext("content", { inlineTailwind: true }),
      buildExtensionContext("options", { tailwind: true }),
      buildExtensionContext("phishing-blocker", { tailwind: true }),
      buildExtensionContext("google", { inlineTailwind: true }),
    ]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
