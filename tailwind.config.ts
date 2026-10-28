import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './tests/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      screens: {
        xs: '420px',
      },
      colors: {
        paper: '#F1ECDD',
        'paper-deep': '#E6DECB',
        ink: '#13201C',
        'ink-soft': '#2A3832',
        chalk: '#EDF4E9',
        ember: '#D9583D',
        'ember-dark': '#B9432D',
        sage: '#A9BDA8',
        'sage-light': '#D9E3D2',
        ochre: '#C99A3D',
        classroom: '#091713',
      },
      fontFamily: {
        display: [
          'var(--font-display)',
          'Iowan Old Style',
          'Baskerville',
          'Songti SC',
          'STSong',
          'serif',
        ],
        sans: [
          'var(--font-plex-sans)',
          'Avenir Next',
          'Segoe UI',
          'PingFang SC',
          'Microsoft YaHei',
          'sans-serif',
        ],
        mono: [
          'var(--font-plex-mono)',
          'Cascadia Code',
          'SFMono-Regular',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        'display-xl': ['clamp(3.4rem, 7.2vw, 7.4rem)', { lineHeight: '0.9', letterSpacing: '-0.055em' }],
        'display-lg': ['clamp(2.7rem, 4.8vw, 5rem)', { lineHeight: '0.94', letterSpacing: '-0.045em' }],
        'display-md': ['clamp(2rem, 3.2vw, 3.2rem)', { lineHeight: '1', letterSpacing: '-0.035em' }],
      },
      boxShadow: {
        card: '0 1px 0 rgba(19,32,28,0.08), 0 18px 50px -30px rgba(19,32,28,0.35)',
        stage: '0 30px 90px -35px rgba(5,18,14,0.75)',
        button: '0 8px 24px -12px rgba(185,67,45,0.75)',
      },
      backgroundImage: {
        'paper-grid':
          'linear-gradient(rgba(19,32,28,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(19,32,28,0.045) 1px, transparent 1px)',
        'stage-glow':
          'radial-gradient(circle at 68% 26%, rgba(177,214,190,0.22), transparent 28%), radial-gradient(circle at 20% 82%, rgba(217,88,61,0.13), transparent 25%)',
      },
      backgroundSize: {
        'grid-32': '32px 32px',
      },
      keyframes: {
        rise: {
          '0%': { opacity: '0', transform: 'translateY(18px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -8px, 0)' },
        },
        'soft-pulse': {
          '0%, 100%': { opacity: '0.55', transform: 'scale(0.96)' },
          '50%': { opacity: '1', transform: 'scale(1)' },
        },
        'ink-draw': {
          '0%': { transform: 'scaleX(0)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'loading-line': {
          '0%': { transform: 'translateX(-110%)' },
          '100%': { transform: 'translateX(220%)' },
        },
      },
      animation: {
        rise: 'rise 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
        drift: 'drift 7s ease-in-out infinite',
        'soft-pulse': 'soft-pulse 3.6s ease-in-out infinite',
        'ink-draw': 'ink-draw 900ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'loading-line': 'loading-line 1.35s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
