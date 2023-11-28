import { access, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";
import dotenv from "dotenv-safe";

try {
  dotenv.config();
} catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
  }

  process.exit(1);
}

const API_URL = "https://webtranslateit.com/api";
const PROJECT_API_KEY = process.env.WEBTRANSLATEIT_PROJECT_API_KEY;

console.log("start loading language file");

(async () => {
  try {
    const response = await fetch(
      `${API_URL}/projects/${PROJECT_API_KEY}/zip_file`,
    );

    if (response.status !== 200)
      throw new Error(`Status code is ${response.status}`);

    const data = await response.arrayBuffer();

    const zipFile = Buffer.from(data);
    console.log("received language file");
    const zip = new AdmZip(zipFile);

    const entries = zip.getEntries();

    await Promise.all(
      entries.map(async (zipEntry) => {
        const lang = zipEntry.name.replace(".json", "");
        console.log(`found language file for: ${lang}`);

        const basePath = path.resolve(`src/_locales/${lang}`);

        try {
          await access(basePath);
        } catch (e) {
          await mkdir(basePath);
        }

        await writeFile(
          path.resolve(`${basePath}/messages.json`),
          JSON.stringify(
            JSON.parse(zipEntry.getData().toString("utf8")),
            null,
            2,
          ),
        );

        console.log(`Saved language file to ${lang}.json`);
      }),
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  console.log("Done prebuilding!");
})();
