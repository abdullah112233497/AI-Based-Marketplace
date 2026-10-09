import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: 'var(--brand)',
          dark: 'var(--brand-dark)',
          soft: 'var(--brand-soft)',
          50: '#F9FAFB',
          100: '#F3F4F6',
          200: '#E5E7EB',
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',
          600: '#4B5563',
          700: '#374151',
          800: '#1F2937',
          900: '#111827',
        },
        onetech: {
          yellow: '#FFBE00',
          yellowHover: '#EAB308',
          red: '#DF2020',
          redHover: '#C91818',
          blue: '#0070F3',
          dark: '#191919',
          card: '#F5F6F8',
        },
        accent: {
          DEFAULT: '#FFBE00',
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#FFBE00',
          600: '#D97706',
          700: '#B45309',
        },
        ink: {
          DEFAULT: 'var(--ink)',
          heading: 'var(--ink-heading)',
          muted: 'var(--muted)',
        },
        surface: {
          DEFAULT: 'var(--surface)',
          hover: 'var(--surface-hover)',
          warm: 'var(--canvas-warm)',
        },
        canvas: {
          DEFAULT: 'var(--canvas)',
          subtle: 'var(--canvas-subtle)',
          warm: 'var(--canvas-warm)',
        },
        border: {
          DEFAULT: 'var(--border)',
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
      },
      borderRadius: {
        input: '8px',
        card: '16px',
        pill: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        card: '0 1px 2px 0 rgba(0, 0, 0, 0.02), 0 4px 16px -2px rgba(0, 0, 0, 0.03)',
        cardHover: '0 4px 12px 0 rgba(0, 0, 0, 0.04), 0 12px 32px -4px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
    },
  },
  plugins: [],
};

export default config;
