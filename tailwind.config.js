/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx,mdx}", "./src/components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1F2937",
          900: "#0F172A"
        }
      },
      boxShadow: {
        card: "0 1px 0 rgba(15, 23, 42, 0.04), 0 12px 40px rgba(15, 23, 42, 0.10)"
      }
    }
  },
  plugins: []
};

