/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./website/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        cute: ['"Comic Neue"', "cursive"],
      },
      keyframes: {
        "slide-in": {
          "0%": { transform: "translateX(-100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
      animation: {
        "slide-in": "slide-in 300ms ease-out forwards",
      },
    },
  },
  plugins: [],
};
