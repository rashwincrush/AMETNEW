/** @type {import('tailwindcss').Config} */
const safeRequire = (name) => {
  try { return require(name); } catch (_) { return null; }
};

const forms = safeRequire('@tailwindcss/forms');
const typography = safeRequire('@tailwindcss/typography');

module.exports = {
  content: [
    "./public/index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'serif': ['"Playfair Display"', 'serif'],
      },
      colors: {
        ocean: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      // Fluid type examples used by utilities
      fontSize: {
        'fluid-h1': ['clamp(1.5rem, 2vw + 1rem, 2.25rem)', { lineHeight: '1.2' }],
        'fluid-h2': ['clamp(1.25rem, 1.5vw + 1rem, 1.75rem)', { lineHeight: '1.25' }],
      },
    },
    // Optional: custom screens including xs; remove if not needed
    screens: {
      xs: '375px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
  plugins: [forms, typography].filter(Boolean),
};