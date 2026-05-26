/** @type {import('tailwindcss').Config} */
// IDMS — Apple-style design system
// Maps src/index.css CSS variables into Tailwind classes.

export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Backgrounds
        bg: 'var(--bg)',
        'bg-raised': 'var(--bg-raised)',
        'bg-sunken': 'var(--bg-sunken)',
        'bg-overlay': 'var(--bg-overlay)',

        // Borders
        border: 'var(--border)',
        'border-mid': 'var(--border-mid)',
        'border-strong': 'var(--border-strong)',

        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-inverse': 'var(--text-inverse)',

        // Accent (Apple blue)
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          soft: 'var(--accent-soft)',
          mid: 'var(--accent-mid)',
        },

        // Status
        green: {
          DEFAULT: 'var(--green)',
          soft: 'var(--green-soft)',
        },
        amber: {
          DEFAULT: 'var(--amber)',
          soft: 'var(--amber-soft)',
        },
        red: {
          DEFAULT: 'var(--red)',
          soft: 'var(--red-soft)',
        },

        // shadcn aliases (so shadcn components work with our system)
        background: 'var(--bg)',
        foreground: 'var(--text-primary)',
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--text-inverse)',
        },
        secondary: {
          DEFAULT: 'var(--bg-sunken)',
          foreground: 'var(--text-primary)',
        },
        muted: {
          DEFAULT: 'var(--bg-sunken)',
          foreground: 'var(--text-secondary)',
        },
        card: {
          DEFAULT: 'var(--bg-raised)',
          foreground: 'var(--text-primary)',
        },
        popover: {
          DEFAULT: 'var(--bg-raised)',
          foreground: 'var(--text-primary)',
        },
        destructive: {
          DEFAULT: 'var(--red)',
          foreground: 'var(--text-inverse)',
        },
        input: 'var(--border-mid)',
        ring: 'var(--accent)',
      },
      borderRadius: {
        sm: 'var(--r-sm)',
        md: 'var(--r-md)',
        lg: 'var(--r-lg)',
        xl: 'var(--r-xl)',
        '2xl': 'var(--r-2xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
        xl: 'var(--shadow-xl)',
      },
      fontFamily: {
        sans: ['DM Sans', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['DM Serif Display', 'Georgia', 'serif'],
      },
      fontSize: {
        display: ['56px', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '600' }],
        h1: ['40px', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '600' }],
        h2: ['32px', { lineHeight: '1.2', letterSpacing: '-0.015em', fontWeight: '600' }],
        h3: ['24px', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
        h4: ['20px', { lineHeight: '1.35', fontWeight: '600' }],
        body: ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        small: ['14px', { lineHeight: '1.5', fontWeight: '400' }],
        caption: ['12px', { lineHeight: '1.45', fontWeight: '500' }],
        label: ['11px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0.06em' }],
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
      },
      transitionTimingFunction: {
        apple: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.96)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.4s ease both',
        'fade-in': 'fade-in 0.3s ease both',
        'scale-in': 'scale-in 0.25s cubic-bezier(0.16, 1, 0.3, 1) both',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
};