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
                use_dynamic_url,
                ...webAccessibleResource
              }: { use_dynamic_url: boolean }) => webAccessibleResource,
            ),
        );
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
    autoprefixer,
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
          for (const outputFile of Object.keys(result.metafile.outputs)) {
            console.log("[info] compiled", outputFile.replace("dist/", ""));
          }
        }
      });
    },
  });

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

    console.log("[info] building for", IS_FIREFOX ? "firefox" : "chrome");

    await Promise.all([
      copyStaticFiles([
        "_locales/",
        "phishing-blocker/rulesets.json",
        "phishing-blocker/index.html",
        "options/index.html",
        "favicon.ico",
        "manifest.json",
        "icon.png",
        "fonts.css",
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
    ]);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
