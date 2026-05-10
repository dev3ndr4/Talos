/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          hover: "rgb(var(--primary-hover) / <alpha-value>)",
        },
        accent: "rgb(var(--accent) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        bg: {
          base: "rgb(var(--bg-base) / <alpha-value>)",
          soft: "rgb(var(--bg-soft) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          subtle: "rgb(var(--muted-subtle) / <alpha-value>)",
        },
        "text-strong": "rgb(var(--text-strong) / <alpha-value>)",
        "text-subtle": "rgb(var(--text-subtle) / <alpha-value>)",
        error: "rgb(var(--error) / <alpha-value>)",
      }
    },
  },
  plugins: [],
}
