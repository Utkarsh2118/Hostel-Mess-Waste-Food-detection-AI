/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sora: ["Sora", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(39,167,117,0.35), 0 0 26px rgba(39,167,117,0.28)",
        card: "0 18px 44px rgba(6, 21, 14, 0.10)",
      },
      keyframes: {
        pulseSoft: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.02)", opacity: "0.92" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pulseSoft: "pulseSoft 2s ease-in-out infinite",
        slideUp: "slideUp .35s ease",
      },
    },
  },
  plugins: [],
};
