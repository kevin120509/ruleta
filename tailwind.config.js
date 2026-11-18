/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fredoka', 'system-ui', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        xmas: ['"Mountains of Christmas"', 'Fredoka', 'serif'],
      },
      colors: {
        night: { 950: '#050a1a', 900: '#0a1430', 800: '#11204a', 700: '#1a2e63' },
        holly: { 400: '#3ecf7a', 500: '#1fa85c', 600: '#168a4a', 700: '#0f6b39', 900: '#0a3a22' },
        berry: { 400: '#ff5a67', 500: '#e63946', 600: '#c1121f', 700: '#9b0d18', 900: '#4a0710' },
        gold: { 200: '#fff1c2', 300: '#ffe08a', 400: '#f9c74f', 500: '#e9a923', 600: '#c4860f' },
        snow: '#f4f8ff',
      },
    },
  },
  plugins: [],
};
