import { writeFile } from "node:fs/promises";
import path from "node:path";
import AdmZip from "adm-zip";

const API_URL = "https://webtranslateit.com/api";
const PUBLIC_API_KEY =
  process.env.WEBTRANSLATEIT_PUBLIC_API_KEY ||
  "proj_readonly_rgfBdjfA-x7HAN1OG37b3Q";
console.log("start loading language file");

(async () => {
  try {
    const response = await fetch(
      `${API_URL}/projects/${PUBLIC_API_KEY}/zip_file`,
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

        await writeFile(
          path.resolve("src/locales/" + lang + ".json"),
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
