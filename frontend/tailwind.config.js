/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'accent-primary': '#00d2ff',
        'accent-secondary': '#3a7bd5',
      }
    },
  },
  plugins: [],
}
