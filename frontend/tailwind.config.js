/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Outfit"', 'system-ui', 'sans-serif'],
        display: ['"Playfair Display"', 'serif'],
        label: ['"Cormorant SC"', 'serif'],
      },
      colors: {
        cream: '#FAF7F2',
        warm: {
          50: '#FDF9F3',
          100: '#F5EDE0',
          200: '#E8DCC8',
          300: '#D4C4A8',
          400: '#B8A080',
          500: '#9A8060',
          600: '#7A6248',
          700: '#5C4A38',
          800: '#3E322A',
          900: '#2A211A',
        },
        sage: {
          50: '#F4F7F4',
          100: '#E3EBE3',
          200: '#C7D6C7',
          300: '#A3BBA3',
          400: '#7A9B7A',
          500: '#5C7F5C',
          600: '#486748',
          700: '#3A5239',
          800: '#2D3F2D',
          900: '#1E2B1E',
        },
        slate: {
          50: '#F2F5F7',
          100: '#DDE4E9',
          200: '#B8C5D0',
          300: '#8DA3B3',
          400: '#6B8598',
          500: '#526A7A',
          600: '#415462',
          700: '#34434F',
          800: '#283340',
          900: '#1C2430',
        },
      },
    },
  },
  plugins: [],
}
