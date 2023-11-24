import browser from "webextension-polyfill";

browser.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [1],
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          regexSubstitution: browser.runtime.getURL(
            "/phishing-blocker/index.html?blockedUrl=\\0",
          ),
        },
      },
      condition: {
        resourceTypes: ["main_frame", "sub_frame"],
        regexFilter:
          "^https?://((?:[-0-9a-z.]+)?(?:s|[0-9])(?:[-0-9a-z.]+)?k(?:[-0-9a-z.]+)?(?:i|[0-9])(?:[-0-9a-z.]+)?n(?:[-0-9a-z.]+)?p(?:[-0-9a-z.]+)?(?:o|[0-9])(?:[-0-9a-z.]+)?r(?:[-0-9a-z.]+)?(?:t|[0-9])(?:[-0-9a-z.]+)?\\.[a-z]+)",
        excludedRequestDomains: ["skinport.com"],
        isUrlFilterCaseSensitive: false,
      },
    },
  ],
});