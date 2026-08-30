/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        reading: ['Literata', 'Georgia', 'serif']
      },
      colors: {
        background: 'var(--background)',
        'background-subtle': 'var(--background-subtle)',
        surface: 'var(--surface)',
        'surface-raised': 'var(--surface-raised)',
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted: 'var(--text-muted)',
        inverse: 'var(--text-inverse)',
        disabled: 'var(--text-disabled)',
        border: 'var(--border)',
        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',
        accent: 'var(--accent)',
        'accent-hover': 'var(--accent-hover)',
        'accent-active': 'var(--accent-active)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
        link: 'var(--link)',
        'link-hover': 'var(--link-hover)',
        'accent-foreground': 'var(--accent-foreground)',
        'focus-ring': 'var(--focus-ring)'
      },
      fontSize: {
        display: ['2.5rem', { lineHeight: '1.1' }],
        'heading-lg': ['2rem', { lineHeight: '1.25' }],
        'heading-md': ['1.5rem', { lineHeight: '1.25' }],
        'heading-sm': ['1.125rem', { lineHeight: '1.25' }],
        body: ['1rem', { lineHeight: '1.5' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        label: ['0.8125rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.5' }]
      },
      borderRadius: { sm: 'var(--radius-sm)', md: 'var(--radius-md)', lg: 'var(--radius-lg)' },
      boxShadow: {
        subtle: '0 1px 2px rgba(32, 36, 33, 0.06)',
        raised: '0 8px 24px rgba(32, 36, 33, 0.12)'
      }
    }
  },
  plugins: []
};
