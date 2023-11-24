import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  interpolation: {
    escapeValue: false,
  },
  debug: process.env.NODE_ENV !== "production",
});

export default i18n;
