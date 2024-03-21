import { type Options, optionsStorage } from "@/lib/options-storage";
import domLoaded from "dom-loaded";
import browser from "webextension-polyfill";

export type Feature = (props: {
  featureAttribute: string;
  createNotMatchingFeatureAttributeSelector: (selector: string) => string;
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
}

const features: [Feature, FeatureConfig][] = [];

function add(feature: Feature, featureConfig: FeatureConfig) {
  features.push([feature, featureConfig]);
}

async function run({
  bridgeContext,
}: { bridgeContext?: "steamcommunity" } = {}) {
  const extensionOptions = await optionsStorage.getAll();
  let bridgeScriptLoaded = false;

  for (const [
    feature,
    { name: featureName, matchPathname, extensionOptionsKey },
  ] of features) {
    if (
      (matchPathname instanceof RegExp &&
        !matchPathname.test(window.location.pathname)) ||
      (typeof matchPathname === "string" &&
        !window.location.pathname.startsWith(matchPathname))
    ) {
      continue;
    }

    if (extensionOptionsKey && extensionOptions[extensionOptionsKey] !== true) {
      continue;
    }

    try {
      await domLoaded;

      if (bridgeContext && bridgeScriptLoaded === false) {
        const scriptElement = document.createElement("script");

        scriptElement.src = browser.runtime.getURL(
          `content/${bridgeContext}/bridge/script.js`,
        );

        await new Promise<void>((resolve) => {
          const listener = () => {
            scriptElement.removeEventListener("load", listener);
            resolve();
          };

          scriptElement.addEventListener("load", listener);

          document.head.append(scriptElement);
        });

        bridgeScriptLoaded = true;
      }

      const featureAttribute = `data-skinport-feature-${featureName}`;

      feature({
        featureAttribute,
        createNotMatchingFeatureAttributeSelector: (selector) =>
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
