export function applyTheme(themeObj) {
  if (!themeObj || typeof themeObj !== 'object') return
  const root = document.documentElement
  if (themeObj.primaryColor) root.style.setProperty('--dms-primary', themeObj.primaryColor)
  if (themeObj.secondaryColor) root.style.setProperty('--dms-secondary', themeObj.secondaryColor)
  if (themeObj.accentColor) root.style.setProperty('--dms-accent', themeObj.accentColor)
  if (themeObj.sidebarBgColor) root.style.setProperty('--dms-sidebar-bg', themeObj.sidebarBgColor)
  if (themeObj.sidebarTextColor) root.style.setProperty('--dms-sidebar-text', themeObj.sidebarTextColor)
  if (themeObj.mainBgColor) root.style.setProperty('--dms-main-bg', themeObj.mainBgColor)
  if (themeObj.tabTextColor) root.style.setProperty('--dms-tab-text', themeObj.tabTextColor)
  if (themeObj.tabActiveColor) root.style.setProperty('--dms-tab-active', themeObj.tabActiveColor)
  if (themeObj.fontFamily) {
    document.body.style.fontFamily = `'${themeObj.fontFamily}', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`
  }

  if (themeObj.bgImage) {
    root.style.setProperty('--dms-bg-image', `url('${themeObj.bgImage}')`)
  } else {
    root.style.setProperty('--dms-bg-image', 'none')
  }

  if (themeObj.favicon) {
    let link = document.querySelector("link[rel~='icon']")
    if (!link) {
      link = document.createElement('link')
      link.rel = 'icon'
      document.head.appendChild(link)
    }
    link.href = themeObj.favicon
  }
}

export function applyCompanyInfo(companyInfo) {
  if (!companyInfo || typeof companyInfo !== 'object') return
  if (companyInfo.companyName) {
    document.title = `${companyInfo.companyName} DMS`
  }
}

export function persistBranding({ companyInfo, theme }) {
  if (companyInfo && typeof companyInfo === 'object') {
    try {
      localStorage.setItem('dms_company_info', JSON.stringify(companyInfo))
    } catch {}
  }
  if (theme && typeof theme === 'object') {
    try {
      localStorage.setItem('dms_theme_settings', JSON.stringify(theme))
    } catch {}
  }
  window.dispatchEvent(new Event('storage'))
}
