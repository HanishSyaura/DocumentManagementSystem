module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f6fcf',
          dark: '#0b57a8'
        },
        sidebar: '#ffffff',
        panel: '#f8fafc',
        muted: '#6b7280'
      },
      boxShadow: {
        'dms-card': '0 8px 20px rgba(21,25,40,0.06)'
      },
      borderRadius: {
        'dms': '8px'
      }
    }
  },
  plugins: []
}
