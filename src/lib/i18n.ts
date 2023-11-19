import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "@/locales/en.json";

i18n.use(initReactI18next).init({
  resources: { en },
  lng: window.navigator.userLanguage || window.navigator.language,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
  debug: process.env.NODE_ENV !== "production",
});

export default i18n;
