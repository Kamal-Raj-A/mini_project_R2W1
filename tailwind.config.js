/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
    "./components.json", // ✅ Added for shadcn/ui
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
