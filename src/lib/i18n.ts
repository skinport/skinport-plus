import type locale from "@/_locales/en/messages.json";
import browser from "webextension-polyfill";

export type I18nMessageKey = keyof typeof locale;

export function getI18nMessage(key: I18nMessageKey) {
  return browser.i18n.getMessage(key);
}
