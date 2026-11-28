/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Night Transit Signage: neutral sign blacks (other views inherit these via obsidian-*)
        obsidian: {
          950: '#0b0c0d',
          900: '#111213',
          850: '#151617',
          800: '#1b1c1d',
          700: '#2a2b2c',
        },
        sign: {
          black: '#000000',
          ground: '#0b0c0d',
          panel: '#111213',
          raised: '#18191a',
          seam: '#2a2b2c',
          dim: '#8a8b87',
          mute: '#a8a9a4',
          white: '#f2f2ee',
        },
        // One route colour per feature line
        line: {
          dps: '#f2762e',
          builds: '#e2332e',
          workbench: '#f7c319',
          map: '#2fa36b',
          enc: '#3b82f6',
          timers: '#a26bd1',
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
        sans: ['Archivo', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
};
