import { context, build } from "esbuild";
import { clean } from "esbuild-plugin-clean";
import { copy } from "esbuild-plugin-copy";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import inline from "esbuild-plugin-inline-import";
import postcss from "postcss";
import { readFile, writeFile } from "node:fs/promises";

const IS_DEV = process.argv.includes("--dev");

const esbuildOptions = {
  entryPoints: ["./src/content/index.tsx"],
  bundle: true,
  outfile: "./dist/content.js",
  plugins: [
    clean({ patterns: ["./dist/*", "!./dist/content.css"] }),
    copy({
      assets: [
        {
          from: ["./src/manifest.json"],
          to: ["./"],
        },
      ],
    }),
    inline({
      filter: /^tailwind:/,
      transform: (content) =>
        postcss(tailwind, autoprefixer)
          .process(content, { from: undefined })
          .then((result) => result.css),
    }),
  ],
};

(async () => {
  try {
    if (IS_DEV) {
      const [esbuildContext] = await Promise.all([
        context(esbuildOptions),
        postcss(tailwind, autoprefixer)
          .process(await readFile("./src/content/index.css"), {
            from: undefined,
          })
          .then((result) => writeFile("./dist/content.css", result.css)),
      ]);

      await esbuildContext.watch();
    } else {
      await build(esbuildOptions);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
