/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        mewmew: {
          primary: '#8b5cf6', // purple
          secondary: '#ec4899', // pink
          accent: '#06b6d4', // cyan
        }
      }
    },
  },
  plugins: [],
}
