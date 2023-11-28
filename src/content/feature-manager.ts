import { type Options, optionsStorage } from "@/lib/options-storage";
import domLoaded from "dom-loaded";

export type Feature = (props: {
  featureAttribute: string;
  getNotMatchingFeatureAttributeSelector: (selector: string) => string;
  setFeatureAttribute(target: HTMLElement): {
    removeFeatureAttribute: () => void;
  };
  getHasFeatureAttribute(target: HTMLElement): boolean;
}) => Promise<void>;

interface FeatureConfig {
  matchPathname?: string | RegExp;
  optionKey?: keyof Options;
  awaitDomReady?: boolean;
}

const features: [Feature, FeatureConfig][] = [];

function add(feature: Feature, featureConfig: FeatureConfig = {}) {
  features.push([feature, featureConfig]);
}

let options: Options | undefined;

async function run() {
  for (const [
    feature,
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

      const featureAttribute = `data-skinport-feature-${feature.name.replace(
        /([A-Z])/g,
        "-$1",
      )}`;

      feature({
        featureAttribute,
        getNotMatchingFeatureAttributeSelector: (selector) =>
          `${selector}:not([${featureAttribute}])`,
        getHasFeatureAttribute: (target) =>
          target.hasAttribute(featureAttribute),
        setFeatureAttribute: (target) => {
          target.setAttribute(featureAttribute, "");

          return {
            removeFeatureAttribute: () =>
              target.removeAttribute(featureAttribute),
          };
        },
      });

      if (process.env.NODE_ENV !== "production") {
        // biome-ignore lint/suspicious/noConsoleLog: Development only
        console.log("feature-manager:", `running feature ${feature.name}`);
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
