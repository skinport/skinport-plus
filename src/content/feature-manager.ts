import { type Options, optionsStorage } from "@/lib/options-storage";
import domLoaded from "dom-loaded";

type RunFeature = () => Promise<void>;

interface FeatureConfig {
  matchPathname?: string | RegExp;
  optionKey?: keyof Options;
  awaitDomReady?: boolean;
}

const features: [RunFeature, FeatureConfig][] = [];

function add(runFeature: RunFeature, featureConfig: FeatureConfig = {}) {
  features.push([runFeature, featureConfig]);
}

let options: Options | undefined;

async function run() {
  for (const [
    runFeature,
    { matchPathname, optionKey, awaitDomReady },
  ] of features) {
    if (
      (matchPathname instanceof RegExp &&
        !matchPathname.test(window.location.pathname)) ||
      (typeof matchPathname === "string" &&
        !window.location.pathname.startsWith(matchPathname))
    ) {
      continue;
    }

    if (optionKey) {
      if (options === undefined) {
        options = await optionsStorage.getAll();
      } else if (options instanceof Promise) {
        await options;
      }

      if (options[optionKey] === false) {
        continue;
      }
    }

    try {
      if (awaitDomReady) {
        await domLoaded;
      }

      runFeature();

      if (process.env.NODE_ENV !== "production") {
        // biome-ignore lint/suspicious/noConsoleLog: Development only
        console.log("feature-manager:", `running feature ${runFeature.name}`);
      }
    } catch (error) {
      console.error(error);
    }
  }
}

export const featureManager = {
  add,
  run,
};
