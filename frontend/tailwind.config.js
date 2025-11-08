/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#00D1B2',
          violet: '#7C4DFF',
          dark: '#071028',
          darkAlt: '#07162a'
        }
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(90deg,#00D1B2,#7C4DFF)',
        'brand-radial': 'radial-gradient(circle at 30% 30%, rgba(124,77,255,0.25), transparent 60%)'
      },
      boxShadow: {
        'glow-lg': '0 0 15px -2px rgba(124,77,255,0.6)',
      }
    },
  },
  plugins: [],
};
