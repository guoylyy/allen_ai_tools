/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'geist-black': '#171717',
        'geist-gray': '#4d4d4d',
        'link-blue': '#0072f5',
        'badge-blue': '#ebf5ff',
        'badge-text': '#0068d6',
      }
    },
  },
  plugins: [],
}
