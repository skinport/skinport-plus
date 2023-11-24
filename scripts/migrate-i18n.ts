import flatten from "obj-flatten";
import { readFile, writeFile } from "node:fs/promises";

(async () => {
  await Promise.all(
    ["en", "de"].map(async (locale) => {
      const srcLocale = JSON.parse(
        await readFile(`./src/locales/${locale}.json`, "utf8"),
      );

      const flattenedSrcLocale = flatten(srcLocale, "_");

      const distLocale = JSON.parse(
        await readFile(`./src/_locales/${locale}/messages.json`, "utf8"),
      );

      await writeFile(
        `./src/_locales/${locale}/messages.json`,
        JSON.stringify(
          {
            ...distLocale,
            ...Object.entries(flattenedSrcLocale).reduce(
              (acc, [key, value]) => ({
                ...acc,
                [key]: {
                  message: value,
                  description: "",
                },
              }),
              {},
            ),
          },
          undefined,
          2,
        ),
      );
    }),
  );
})();
