import type { Config } from 'tailwindcss'

export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // SHIFTShield design system
        primary: {
          DEFAULT: '#10243A',
          50: '#E8EEF4',
          100: '#C5D4E3',
          200: '#9DB8CF',
          300: '#749BBC',
          400: '#4B7EA8',
          500: '#336A93',
          600: '#2A5577',
          700: '#1F405A',
          800: '#152B3D',
          900: '#10243A',
        },
        secondary: {
          DEFAULT: '#526579',
          50: '#EEF1F4',
          100: '#D4DCE4',
          200: '#B8C5D0',
          300: '#9BAEBC',
          400: '#7E97A8',
          500: '#677F94',
          600: '#526579',
          700: '#3E4D5B',
          800: '#29343D',
          900: '#151B1F',
        },
        background: '#F5F7FA',
        card: '#FFFFFF',
        accent: {
          DEFAULT: '#12B8A6',
          50: '#E4F8F6',
          100: '#BCEEE9',
          200: '#8FE3DB',
          300: '#62D8CD',
          400: '#36CDBE',
          500: '#12B8A6',
          600: '#0E9285',
          700: '#0A6C63',
          800: '#064742',
          900: '#032221',
        },
        success: {
          DEFAULT: '#16A36A',
          light: '#E6F7F0',
          dark: '#0D7A4F',
        },
        warning: {
          DEFAULT: '#F2A93B',
          light: '#FEF6E8',
          dark: '#C8821A',
        },
        critical: {
          DEFAULT: '#DC4545',
          light: '#FDEAEA',
          dark: '#A82F2F',
        },
        risk: {
          low: '#16A36A',
          moderate: '#F2A93B',
          elevated: '#F97316',
          high: '#DC4545',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        input: '8px',
        badge: '9999px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.10), 0 8px 24px rgba(0,0,0,0.06)',
        modal: '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)',
      },
      animation: {
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 69, 69, 0.4)' },
          '50%': { boxShadow: '0 0 0 12px rgba(220, 69, 69, 0)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config
