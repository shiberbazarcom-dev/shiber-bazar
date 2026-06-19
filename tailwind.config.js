/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#172554",
        },
        gold: {
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      fontFamily: {
        sans: ["Noto Sans Bengali", "Arial", "sans-serif"],
      },
      boxShadow: {
        "card": "0 1px 4px rgba(0,0,0,.10)",
        "card-hover": "0 4px 20px rgba(0,0,0,.12)",
      },
      animation: {
        "fade-up": "fadeUp .35s ease both",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: "translateY(12px)" },
          to:   { opacity: 1, transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
