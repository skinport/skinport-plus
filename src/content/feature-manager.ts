import optionsStorage, { Options } from "@/lib/options-storage";

type Feature = () => Promise<void>;

export const supportedHosts = {
  steamCommunity: "steamcommunity.com",
  skinport: "skinport.com",
} as const;

interface FeatureConfig {
  host: (typeof supportedHosts)[keyof typeof supportedHosts];
  matchPathname?: string | RegExp;
  optionKey?: keyof Options;
}

const featuresByHost: Record<
  (typeof supportedHosts)[keyof typeof supportedHosts],
  [Feature, FeatureConfig][]
> = {
  [supportedHosts.steamCommunity]: [],
  [supportedHosts.skinport]: [],
};

function add(feature: Feature, config: FeatureConfig) {
  featuresByHost[config.host].push([feature, config]);
}

let options: Options;

async function init() {
  options = await optionsStorage.getAll();
}

async function run() {
  const hostFeatures =
    featuresByHost[
      window.location
        .host as (typeof supportedHosts)[keyof typeof supportedHosts]
    ];

  if (!hostFeatures) {
    return;
  }

  hostFeatures.forEach(([feature, { matchPathname, optionKey }]) => {
    if (
      (matchPathname &&
        matchPathname instanceof RegExp &&
        !matchPathname.test(window.location.pathname)) ||
      (typeof matchPathname === "string" &&
        !window.location.pathname.startsWith(matchPathname))
    ) {
      return;
    }

    if (optionKey && options[optionKey] === false) {
      return;
    }

    try {
      if (process.env.NODE_ENV !== "production") {
        console.log("feature-manager:", `running feature ${feature.name}`);
      }

      feature();
    } catch (error) {
      console.error(error);
    }
  });
}

const featureManager = {
  add,
  init,
  run,
};

export default featureManager;
