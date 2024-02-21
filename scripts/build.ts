import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";
import autoprefixer from "autoprefixer";
import chokidar from "chokidar";
// @ts-expect-error: Doesn't come with TS definitions and `@types/dot-json` isn't available
import DotJson from "dot-json";
import * as esbuild from "esbuild";
import esbuildInline from "esbuild-plugin-inline-import";
import esbuildStyle from "esbuild-style-plugin";
import postcss from "postcss";
import tailwind from "tailwindcss";
import { tailwindBaseConfig } from "../tailwind.config";

const IS_FIREFOX = process.argv.includes("--firefox");
const IS_DEV = process.argv.includes("--dev");
// Keep in sync with src/manifest.json!
const TARGET_BROWSER = IS_FIREFOX ? "firefox 114" : "chrome 105";

function getSrcPath(srcPath = "") {
  return path.join("./src", srcPath);
}

function getDistPath(distPath = "") {
  return path.join("./dist", distPath);
}

async function copySrcFileToDist(srcFile: string) {
  const srcPath = srcFile.startsWith("src") ? srcFile : getSrcPath(srcFile);
  const distPath = getDistPath(srcPath.replace("src", ""));

  await cp(srcPath, distPath, {
    recursive: true,
  });

  if (distPath.endsWith("manifest.json")) {
    const manifestJson = new DotJson(distPath);

    if (IS_FIREFOX) {
      manifestJson
        // Firefox doesn't support `background.service_worker`, but `background.scripts`:
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background#browser_support
        // TODO: Remove/change this once browsers have come to a common solution
        .set("background.scripts", [
          manifestJson.get("background.service_worker"),
        ])
        .delete("background.service_worker")
        // Remove keys not supported by Firefox
        .delete("minimum_chrome_version")
        .set(
          "web_accessible_resources",
          manifestJson
            .get("web_accessible_resources")
            .map(
              ({
                use_dynamic_url: _,
                ...webAccessibleResource
              }: { use_dynamic_url: boolean }) => webAccessibleResource,
            ),
        )
        // Firefox only supports `optional_permissions` instead of `optional_host_permissions`:
        // https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/optional_permissions#host_permissions
        // TODO: Remove once `optional_host_permissions` is supported
        .set(
          "optional_permissions",
          manifestJson.get("optional_host_permissions"),
        )
        .delete("optional_host_permissions");
    } else {
      // Remove keys not supported by Chrome
      manifestJson.delete("browser_specific_settings");
    }

    if (IS_DEV) {
      manifestJson.set(
        "content_scripts",
        manifestJson
          .get("content_scripts")
          .map((contentScript: { matches: string[] }) => {
            if (contentScript.matches.includes("https://skinport.com/*")) {
              return {
                ...contentScript,
                matches: contentScript.matches.concat("http://localhost/*"),
              };
            }

            return contentScript;
          }),
      );
    }

    manifestJson.save();
  }

  // biome-ignore lint/suspicious/noConsoleLog:
  console.log("[info] copied", srcPath.replace("src/", ""));
}

function getPostcssPlugins(tailwindContent: string[]) {
  return <postcss.AcceptedPlugin[]>[
    tailwind({
      ...tailwindBaseConfig,
      content: [
        ...(tailwindBaseConfig.content as string[]),
        ...tailwindContent,
      ],
    }),
    autoprefixer({
      overrideBrowserslist: TARGET_BROWSER,
    }),
  ];
}

async function copyStaticFiles(srcFiles: string[]) {
  await Promise.all(srcFiles.map(copySrcFileToDist));

  if (IS_DEV) {
    chokidar
      .watch(
        getSrcPath(
          `{${srcFiles
            .map((srcFile) =>
              srcFile.endsWith("/") ? srcFile.replace("/", "/**/*") : srcFile,
            )
            .join(",")}}`,
        ),
      )
      .on("change", copySrcFileToDist);
  }
}

const esbuildLogPlugin: esbuild.Plugin = {
  name: "log",
  setup: (build) => {
    build.onEnd((result) => {
      if (result.metafile?.outputs) {
        for (const outputFile of Object.keys(result.metafile.outputs)) {
          // biome-ignore lint/suspicious/noConsoleLog:
          console.log("[info] compiled", outputFile.replace("dist/", ""));
        }
      }
    });
  },
};

async function buildExtensionContext(
  context: string,
  {
    tailwind,
    inlineTailwind,
    indexSuffix,
  }: {
    tailwind?: boolean;
    inlineTailwind?: boolean;
    indexSuffix: "ts" | "tsx";
  },
) {
  const esbuildOptions: esbuild.BuildOptions & { plugins: esbuild.Plugin[] } = {
    entryPoints: [getSrcPath(`${context}/index.${indexSuffix}`)],
    outfile: getDistPath(`${context}/index.js`),
    bundle: true,
    minify: !IS_DEV,
    metafile: true,
    plugins: [],
    target: TARGET_BROWSER.replace(" ", ""),
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
        transform: async (content) => {
          const css = await postcss(
            getPostcssPlugins([getSrcPath(`${context}/**/*.{ts,tsx}`)]),
          )
            .process(content, { from: undefined })
            .then((result) => result.css)
            .catch((error) => {
              console.error(error.message);
              return "";
            });

          if (!IS_DEV) {
            return (
              await esbuild.transform(css, {
                loader: "css",
                minify: true,
                target: TARGET_BROWSER.replace(" ", ""),
              })
            ).code;
          }

          return css;
        },
      }),
    );
  }

  esbuildOptions.plugins.push(esbuildLogPlugin);

  if (IS_DEV) {
    const esbuildContext = await esbuild.context(esbuildOptions);

    return esbuildContext.watch();
  }

  return esbuild.build(esbuildOptions);
}

async function buildScript(src: string) {
  const esbuildOptions: esbuild.BuildOptions & { plugins: esbuild.Plugin[] } = {
    entryPoints: [getSrcPath(src)],
    outfile: getDistPath(src.replace(".ts", ".js")),
    bundle: true,
    minify: !IS_DEV,
    metafile: true,
    target: TARGET_BROWSER.replace(" ", ""),
    plugins: [esbuildLogPlugin],
  };

  if (IS_DEV) {
    const esbuildContext = await esbuild.context(esbuildOptions);

    return esbuildContext.watch();
  }

  return esbuild.build(esbuildOptions);
}

(async () => {
  try {
    await rm(getDistPath(), { recursive: true, force: true });

    await mkdir(getDistPath());

    // biome-ignore lint/suspicious/noConsoleLog:
    console.log("[info] building for", IS_FIREFOX ? "firefox" : "chrome");

    await Promise.all([
      copyStaticFiles([
        "_locales/",
        "options/index.html",
        "phishing-blocker/index.html",
        "favicon.ico",
        "fonts.css",
        "icon16.png",
        "icon48.png",
        "icon128.png",
        "manifest.json",
      ]),
      buildExtensionContext("background", { indexSuffix: "ts" }),
      buildExtensionContext("content/google", {
        indexSuffix: "ts",
        inlineTailwind: true,
      }),
      buildExtensionContext("content/skinport", { indexSuffix: "ts" }),
      buildExtensionContext("content/steamcommunity", {
        indexSuffix: "ts",
        inlineTailwind: true,
      }),
      buildExtensionContext("options", { indexSuffix: "tsx", tailwind: true }),
      buildExtensionContext("phishing-blocker", {
        indexSuffix: "tsx",
        tailwind: true,
      }),
      buildScript("content/steamcommunity/bridge/script.ts"),
    ]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
