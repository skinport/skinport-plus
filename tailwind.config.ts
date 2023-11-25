import { type Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const tailwindConfig: Config = {
  content: ["./src/components/**/*.{ts,tsx}"],
  theme: {
    fontFamily: {
      sans: ["Montserrat", "sans-serif"],
    },
    extend: {
      colors: {
        background: "#2b2f30",
        foreground: "#8e9191",
        blue: {
          darkest: "#307087",
          dark: "#36809a",
          DEFAULT: "#4db5da",
        },
        red: {
          DEFAULT: "#fa490a",
          light: "#E05A59",
          lightest: "#e46f6e",
        },
        white: {
          darkest: "#747778",
          dark: "#8e9191",
          DEFAULT: "#f6f6f6",
          light: "#ffffff",
          washed: "#e5eff5",
        },
        gray: {
          lighter: "#7a7f8d",
          light: "#53575f",
          DEFAULT: "#51545d",
          dark: "#43484a",
          darker: "#333839",
          darkest: "#323738",
        },
        card: {
          DEFAULT: "#323738",
          foreground: "#9fa1a2",
        },
      },
    },
  },
  plugins: [animate],
};

export default tailwindConfig;
