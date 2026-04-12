/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Airbnb Rausch Red
        primary: {
          DEFAULT: '#ff385c',
          50: '#fef7f0',
          100: '#fdecdb',
          200: '#fad6b3',
          300: '#f6b97d',
          400: '#f19043',
          500: '#ff385c',
          600: '#e00b41',
          700: '#b94310',
          800: '#933615',
          900: '#772f14',
        },
        // Near Black (warm)
        neutral: {
          DEFAULT: '#222222',
          50: '#f2f2f2',
          100: '#e5e5e5',
          200: '#c1c1c1',
          300: '#929292',
          400: '#6a6a6a',
          500: '#3f3f3f',
          600: '#222222',
          700: '#1a1a1a',
          800: '#111111',
          900: '#000000',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif']
      },
      boxShadow: {
        'card': 'rgba(0,0,0,0.02) 0px 0px 0px 1px, rgba(0,0,0,0.04) 0px 2px 6px, rgba(0,0,0,0.1) 0px 4px 8px',
        'card-hover': 'rgba(0,0,0,0.08) 0px 4px 12px',
      },
      borderRadius: {
        'badge': '14px',
        'card': '20px',
        'large': '32px',
      }
    },
  },
  plugins: [],
}