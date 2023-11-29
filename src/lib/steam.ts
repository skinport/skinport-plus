import browser from "webextension-polyfill";

export const steamAppIdNames = {
  "730": "cs2",
  "440": "tf2",
  "570": "dota2",
  "252490": "rust",
} as const;

export const supportedSteamAppIds = Object.keys(steamAppIdNames);

export async function verifyTradingPartner(steamId: string) {
  const { response, error } = await browser.runtime.sendMessage({
    skinportApi: `v1/extension/bot/${steamId}`,
  });

  if (error) {
    throw Error(error);
  }

  return response.verified;
}
