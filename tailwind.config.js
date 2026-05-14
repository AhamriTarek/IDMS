/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: '#0A0F1E',
          800: '#0D1526',
          700: '#111827',
          600: '#1A2540',
        },
        cyan: {
          neon: '#00D4FF',
        },
        purple: {
          deep: '#7C3AED',
        },
      },
      fontFamily: {
        grotesk: ['"Space Grotesk"', 'sans-serif'],
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.15)',
        'neon-purple': '0 0 20px rgba(124,58,237,0.4), 0 0 60px rgba(124,58,237,0.15)',
        glass: '0 8px 32px rgba(0,0,0,0.4)',
      },
      backdropBlur: {
        glass: '16px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        typewriter: 'typewriter 3s steps(40) forwards',
        blink: 'blink 0.8s step-end infinite',
      },
      keyframes: {
        typewriter: {
          from: { width: '0' },
          to: { width: '100%' },
        },
        blink: {
          '0%,100%': { borderColor: 'transparent' },
          '50%': { borderColor: '#00D4FF' },
        },
      },
    },
  },
  plugins: [],
}
