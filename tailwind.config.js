/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          950: '#07090d',
          900: '#0d1118',
          850: '#121822',
          800: '#18202c',
          700: '#232e3f',
        },
        stardust: {
          400: '#38bdf8',
          500: '#0ea5e9',
          glow: '#22d3ee',
        },
        anomaly: {
          400: '#f59e0b',
          500: '#d97706',
        },
        crimson: {
          400: '#fb7185',
          500: '#f43f5e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
