/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./src/**/*.{ts,tsx}`],
  theme: {
    fontFamily: {
      sans: ["Montserrat", "sans-serif"],
    },
    extend: {
      colors: {
        "skinport-bg": "#2b2f30",
        "skinport-white": "#f6f6f6",
        "skinport-gray": "#8e9191",
        "skinport-orange": "#fa490a",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
