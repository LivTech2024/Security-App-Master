/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: "#FFFFFF", // background colors of components like card, buttons, etc.
        onSurface: "#000000", // text and icon colors of components like card, buttons, etc.

        primaryGold: "#fbbf39",

        primary: "#000000",
        primaryVariant: "#3A3B3C",
        primaryGreen: "#22c55e",
        primaryRed: "#ef4444",
        secondary: "#0E5FFF",

        //text colors
        textPrimary: "#000000",
        textSecondary: "#3E3F43",
        textTertiary: "#667781",
        textQuaternary: "#A3A3A3",
        textSecondaryBlue: "#508BFF",
        textPrimaryBlue: "#0E5FFF",
        textPrimaryRed: "#ef4444",

        //button hover bg
        greenButtonHoverBg: "#16a34a",
        greenButtonActiveBg: "#15803d",
        blueButtonHoverBg: "#0e5effd8",
        blueButtonActiveBg: "#0e5efffa",
        blackButtonHoverBg: "#000000bb",
        blackButtonActiveBg: "#000000d9",

        onHoverBg: "#F4F4F4",
      },
    },
  },
  plugins: [],
};
