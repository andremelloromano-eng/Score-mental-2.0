/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        background: "#050816",
        foreground: "#E5E7EB",
        accent: {
          DEFAULT: "#4F46E5",
          soft: "#312E81"
        },
        muted: "#6B7280",
        card: "#020617",
        "card-soft": "#020617",
        border: "#1F2937"
      },
      boxShadow: {
        soft: "0 18px 45px rgba(15,23,42,0.85)"
      }
    }
  },
  plugins: []
};

