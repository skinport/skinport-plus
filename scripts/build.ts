import { context, build } from "esbuild";
import { clean } from "esbuild-plugin-clean";
import { copy } from "esbuild-plugin-copy";
import style from "esbuild-style-plugin";
import tailwind from "tailwindcss";
import autoprefixer from "autoprefixer";
import inline from "esbuild-plugin-inline-import";
import postcss from "postcss";

const IS_DEV = process.argv.includes("--dev");

const esbuildOptions = {
  entryPoints: ["./src/content/index.tsx"],
  bundle: true,
  outfile: "./dist/content.js",
  plugins: [
    clean({ patterns: "./dist/*" }),
    copy({
      assets: [
        {
          from: ["./src/manifest.json"],
          to: ["./"],
        },
        {
          from: ["./src/content/index.css"],
          to: ["./content.css"],
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
      const esbuildContext = await context(esbuildOptions);

      await esbuildContext.watch();
    } else {
      await build(esbuildOptions);
    }
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();
