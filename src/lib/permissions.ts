import browser from "webextension-polyfill";

export const ALL_URLS_MATCH_PATTERN = "*://*/*";

export async function getHasAllUrlsPermission() {
  const permissions = await browser.permissions.getAll();

  return permissions.origins?.indexOf(ALL_URLS_MATCH_PATTERN) !== -1;
}

export async function requestAllUrlsPermission() {
  const isAllUrlsPermissionsGranted = await browser.permissions.request({
    origins: [ALL_URLS_MATCH_PATTERN],
  });

  await browser.runtime.sendMessage({
    action: "registerContentScripts",
  });

  return isAllUrlsPermissionsGranted;
}
