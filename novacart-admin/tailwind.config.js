/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Admin panel dark theme
        admin: {
          bg: '#0F1117',
          surface: '#161B27',
          card: '#1C2333',
          border: '#252D3D',
          hover: '#222B3E',
        },
        // Nova purple accent (matching customer frontend)
        nova: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
        },
        // Status colors
        success: {
          DEFAULT: '#10B981',
          bg: 'rgba(16,185,129,0.1)',
        },
        warning: {
          DEFAULT: '#F59E0B',
          bg: 'rgba(245,158,11,0.1)',
        },
        danger: {
          DEFAULT: '#EF4444',
          bg: 'rgba(239,68,68,0.1)',
        },
        info: {
          DEFAULT: '#3B82F6',
          bg: 'rgba(59,130,246,0.1)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.3), 0 8px 32px rgba(0,0,0,0.2)',
        glow: '0 0 20px rgba(124,58,237,0.3)',
      },
      borderRadius: {
        '2xl': '1rem',
      },
      animation: {
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s ease-in-out infinite',
      },
      keyframes: {
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}
