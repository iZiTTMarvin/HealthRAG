/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#FDFBF7", // Cream White
        primary: {
          DEFAULT: "#84A98C", // Sage Green
          hover: "#6B8E73",
          active: "#52796F",
        },
        secondary: {
          DEFAULT: "#E29578", // Muted Terracotta
          hover: "#D68160",
        },
        text: {
          main: "#2D3748", // Dark Charcoal
          muted: "#718096",
          light: "#A0AEC0",
        },
        surface: {
          white: "#FFFFFF",
          glass: "rgba(255, 255, 255, 0.7)",
        },
        accent: {
          green: "#52B788",
          red: "#E07A5F",
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'sans-serif'],
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
