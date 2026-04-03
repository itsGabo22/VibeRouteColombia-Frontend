/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          dark: '#1A6B5A',
          DEFAULT: '#2ECC7F',
          light: '#E8F5F0',
        },
        warning: '#F5C518',
        danger: '#E74C3C',
        surface: '#FFFFFF',
        border: '#E5E7EB',
        text: {
          primary: '#1F2937',
          secondary: '#6B7280',
        },
      },
    },
  },
  plugins: [],
}
