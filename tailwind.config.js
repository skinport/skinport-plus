/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [`./src/${process.env.EXT_SCRIPT}/**/*.tsx`],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
  prefix: "sp-",
};
