import optionsStorage, { Options } from "@/lib/options-storage";
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
  features.forEach(
    async ([runFeature, { matchPathname, optionKey, awaitDomReady }]) => {
      if (
        (matchPathname &&
          matchPathname instanceof RegExp &&
          !matchPathname.test(window.location.pathname)) ||
        (typeof matchPathname === "string" &&
          !window.location.pathname.startsWith(matchPathname))
      ) {
        return;
      }

      if (optionKey) {
        if (options === undefined) {
          options = await optionsStorage.getAll();
        } else if (options instanceof Promise) {
          await options;
        }

        if (options[optionKey] === false) {
          return;
        }
      }

      try {
        if (process.env.NODE_ENV !== "production") {
          console.log("feature-manager:", `running feature ${runFeature.name}`);
        }

        if (awaitDomReady) {
          await domLoaded;
        }

        runFeature();
      } catch (error) {
        console.error(error);
      }
    },
  );
}

const featureManager = {
  add,
  run,
};

export default featureManager;
