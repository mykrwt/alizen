import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Refined neutral-first palette — inspired by Linear & Vercel
        alizen: {
          bg:      '#09090b',  // zinc-950 — pure dark
          panel:   '#0f0f12',  // slightly lifted
          surface: '#17171c',  // card/hover surface
          raised:  '#1c1c22',  // elevated elements
          border:  '#27272a',  // zinc-800 — subtle, not distracting
          divider: '#1e1e22',  // even subtler separator
          muted:   '#71717a',  // zinc-500
          subtle:  '#a1a1aa',  // zinc-400
          text:    '#fafafa',  // zinc-50
          dim:     '#d4d4d8',  // zinc-300
          accent:  '#6366f1',  // indigo-500 — single, intentional accent
          'accent-hover': '#818cf8', // indigo-400
          'accent-subtle': 'rgba(99, 102, 241, 0.1)',
          'accent-muted':  'rgba(99, 102, 241, 0.06)',
          success: '#22c55e',
          warning: '#eab308',
          error:   '#ef4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        display: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      boxShadow: {
        'glow':       '0 0 0 1px rgba(99, 102, 241, 0.1), 0 0 20px -4px rgba(99, 102, 241, 0.15)',
        'glow-sm':    '0 0 12px -2px rgba(99, 102, 241, 0.12)',
        'elevated':   '0 0 0 1px rgba(255,255,255,0.03), 0 8px 30px -8px rgba(0,0,0,0.5)',
        'panel':      '0 0 0 1px rgba(255,255,255,0.04), 0 1px 2px rgba(0,0,0,0.3)',
        'modal':      '0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px -12px rgba(0,0,0,0.7)',
        'button':     '0 1px 2px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.04)',
      },
      borderRadius: {
        'DEFAULT': '6px',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.97)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'pulse-dot': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.4' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(-4px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.15s ease-out',
        'fade-up':        'fade-up 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        'scale-in':       'scale-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        'shimmer':        'shimmer 2s linear infinite',
        'pulse-dot':      'pulse-dot 2s ease-in-out infinite',
        'slide-in-right': 'slide-in-right 0.2s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
