import { context, build } from "esbuild";
import { copy } from "esbuild-plugin-copy";
import { clean } from "esbuild-plugin-clean";

const IS_DEV = process.argv.includes("--dev");

const esbuildOptions = {
  entryPoints: ["./src/content/index.tsx"],
  bundle: true,
  outfile: "./dist/content.js",
  plugins: [
    clean({ patterns: ["./dist/*"] }),
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./src/manifest.json"],
        to: ["./dist"],
      },
      watch: IS_DEV,
    }),
  ],
};

(async () => {
  if (IS_DEV) {
    const esbuildContext = await context(esbuildOptions);

    await esbuildContext.watch();
  } else {
    build(esbuildOptions);
  }
})();
