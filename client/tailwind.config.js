/** @type {import('tailwindcss').Config} */
// Colors are CSS variables defined in src/styles.scss (see DESIGN.md).
const v = name => `rgb(var(--${name}) / <alpha-value>)`;
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      colors: {
        bg: v('bg'),
        surface: v('surface'),
        raised: v('raised'),
        line: v('line'),
        ink: { DEFAULT: v('ink'), muted: v('ink-muted'), faint: v('ink-faint') },
        accent: { DEFAULT: v('accent'), ink: v('accent-ink'), hover: v('accent-hover') },
        danger: v('danger'),
        success: v('success'),
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', '16px'],
      },
      borderRadius: { card: '10px' },
      maxWidth: { page: '1280px' },
    },
  },
  plugins: [],
};
