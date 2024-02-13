import { type Options, optionsStorage } from "@/lib/options-storage";
import domLoaded from "dom-loaded";

export type Feature = (props: {
  featureAttribute: string;
  getNotMatchingFeatureAttributeSelector: (selector: string) => string;
  setFeatureAttribute(target: HTMLElement): {
    removeFeatureAttribute: () => void;
  };
  getHasFeatureAttribute(target: HTMLElement): boolean;
  extensionOptions: Options;
}) => Promise<void>;

interface FeatureConfig {
  name: string;
  matchPathname?: string | RegExp;
  extensionOptionsKey?: keyof Options;
  awaitDomReady?: boolean;
}

const features: [Feature, FeatureConfig][] = [];

function add(feature: Feature, featureConfig: FeatureConfig) {
  features.push([feature, featureConfig]);
}

let extensionOptions: Options | undefined;

async function run() {
  for (const [
    feature,
    { name: featureName, matchPathname, extensionOptionsKey, awaitDomReady },
  ] of features) {
    if (
      (matchPathname instanceof RegExp &&
        !matchPathname.test(window.location.pathname)) ||
      (typeof matchPathname === "string" &&
        !window.location.pathname.startsWith(matchPathname))
    ) {
      continue;
    }

    if (extensionOptions === undefined) {
      extensionOptions = await optionsStorage.getAll();
    } else if (extensionOptions instanceof Promise) {
      await extensionOptions;
    }

    if (
      extensionOptionsKey &&
      extensionOptions[extensionOptionsKey] === false
    ) {
      continue;
    }

    try {
      if (awaitDomReady) {
        await domLoaded;
      }

      const featureAttribute = `data-skinport-feature-${featureName}`;

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
        extensionOptions,
      });

      if (process.env.NODE_ENV !== "production") {
        // biome-ignore lint/suspicious/noConsoleLog: Development only
        console.log("feature-manager:", `running feature ${featureName}`);
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
