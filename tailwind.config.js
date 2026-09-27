/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx,svelte,vue}'],
  theme: {
    extend: {
      colors: {
        'navy-dark': '#061124',
        'navy-card': '#0A1931',
        'navy-border': '#162847',
        'navy-surface': '#0d203f',
        'gold-accent': '#D4AF37',
        'gold-light': '#E9C349',
        'gold-dim': '#A38020',
        'gold-deep': '#C5A028',
        'brand-red': '#D32F2F',
        'brand-red-hover': '#B71C1C',
        'surface-light': '#F8F9FA',
        'surface-card': '#FFFFFF',
        'text-dark': '#0F172A',
        'text-muted': '#64748B',
        whatsapp: '#25D366',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        heading: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        crimson: '0 6px 20px rgba(211,47,47,0.4)',
        'crimson-lg': '0 8px 25px rgba(211,47,47,0.45)',
        whatsapp: '0 8px 25px rgba(37,211,102,0.45)',
        'gold-glow': '0 0 15px rgba(212,175,55,0.25)',
      },
      animation: {
        marquee: 'marqueeScroll 45s linear infinite',
        'pulse-ring': 'pulse-ring 2.5s infinite',
      },
      keyframes: {
        marqueeScroll: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(37, 211, 102, 0.6)' },
          '70%': { transform: 'scale(1)', boxShadow: '0 0 0 14px rgba(37, 211, 102, 0)' },
          '100%': { transform: 'scale(0.95)', boxShadow: '0 0 0 0 rgba(37, 211, 102, 0)' },
        },
      },
    },
  },
  plugins: [],
};
