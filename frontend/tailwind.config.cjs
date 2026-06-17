module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--dms-color-bg-canvas)',
        surface: {
          DEFAULT: 'var(--dms-color-bg-surface)',
          muted: 'var(--dms-color-bg-surface-muted)',
          strong: 'var(--dms-color-bg-surface-strong)'
        },
        brand: {
          DEFAULT: 'var(--dms-color-brand-primary)',
          hover: 'var(--dms-color-brand-primary-hover)',
          secondary: 'var(--dms-color-brand-secondary)'
        },
        border: {
          DEFAULT: 'var(--dms-color-border-default)',
          strong: 'var(--dms-color-border-strong)'
        },
        ink: {
          DEFAULT: 'var(--dms-color-text-primary)',
          secondary: 'var(--dms-color-text-secondary)',
          muted: 'var(--dms-color-text-muted)',
          soft: 'var(--dms-color-text-soft)',
          inverse: 'var(--dms-color-text-inverse)'
        },
        primary: {
          DEFAULT: '#0f6fcf',
          dark: '#0b57a8'
        },
        sidebar: '#ffffff',
        panel: '#f8fafc',
        muted: '#6b7280'
      },
      boxShadow: {
        'dms-card': 'var(--dms-shadow-md)',
        'dms-soft': 'var(--dms-shadow-sm)',
        'dms-lg': 'var(--dms-shadow-lg)'
      },
      borderRadius: {
        'dms': 'var(--dms-radius-md)',
        'dms-sm': 'var(--dms-radius-sm)',
        'dms-lg': 'var(--dms-radius-lg)'
      },
      spacing: {
        'page-x': 'var(--dms-layout-page-gutter-desktop)'
      },
      width: {
        sidebar: 'var(--dms-layout-sidebar-width)',
        'sidebar-lg': 'var(--dms-layout-sidebar-width-lg)',
        'sidebar-collapsed': 'var(--dms-layout-sidebar-collapsed)',
        rightpanel: 'var(--dms-layout-rightpanel-width)'
      },
      height: {
        topbar: 'var(--dms-layout-topbar-height)'
      }
    }
  },
  plugins: []
}
