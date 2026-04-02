import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import { usePreferences } from '../contexts/PreferencesContext'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { t } = usePreferences()
  const [sidebarPosition, setSidebarPosition] = useState('left')
  // Right panel is collapsed by default on all pages except dashboard
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(location.pathname !== '/dashboard')

  useEffect(() => {
    // Apply full theme on mount and theme changes
    const applyTheme = (themeObj) => {
      const root = document.documentElement
      root.style.setProperty('--dms-primary', themeObj.primaryColor)
      root.style.setProperty('--dms-secondary', themeObj.secondaryColor)
      root.style.setProperty('--dms-accent', themeObj.accentColor)
      root.style.setProperty('--dms-sidebar-bg', themeObj.sidebarBgColor)
      root.style.setProperty('--dms-sidebar-text', themeObj.sidebarTextColor)
      root.style.setProperty('--dms-tab-text', themeObj.tabTextColor)
      root.style.setProperty('--dms-tab-active', themeObj.tabActiveColor)
      document.body.style.fontFamily = `'${themeObj.fontFamily}', system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial`
      
      // Update background image if present
      if (themeObj.bgImage) {
        root.style.setProperty('--dms-bg-image', `url('${themeObj.bgImage}')`)
        root.style.setProperty('--dms-main-bg', themeObj.mainBgColor + 'cc') // Add 80% opacity
      } else {
        root.style.setProperty('--dms-bg-image', 'none')
        root.style.setProperty('--dms-main-bg', themeObj.mainBgColor)
      }
      
      // Update favicon if present
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

    // Load theme settings to get sidebar position and apply theme
    const loadThemeSettings = () => {
      const savedTheme = localStorage.getItem('dms_theme_settings')
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme)
          setSidebarPosition(theme.sidebarPosition || 'left')
          // Apply the full theme
          applyTheme(theme)
        } catch (e) {
          console.error('Failed to parse theme settings', e)
        }
      } else {
        // Apply Corporate theme as default if no theme is saved
        const defaultCorporateTheme = {
          primaryColor: '#003366',
          secondaryColor: '#0066CC',
          accentColor: '#FF9900',
          successColor: '#28A745',
          warningColor: '#FFC107',
          errorColor: '#DC3545',
          infoColor: '#0066CC',
          sidebarBgColor: '#003366',
          sidebarTextColor: '#E3F2FD',
          mainBgColor: '#F5F7FA',
          tabTextColor: '#64748B',
          tabActiveColor: '#0066CC',
          btnPrimaryBg: '#003366',
          btnPrimaryText: '#FFFFFF',
          btnPrimaryHover: '#002244',
          btnSecondaryBg: '#E3F2FD',
          btnSecondaryText: '#003366',
          btnSecondaryHover: '#BBDEFB',
          landingNavBg: '#003366',
          landingNavText: '#FFFFFF',
          landingHeroGradientStart: '#003366',
          landingHeroGradientMid: '#0066CC',
          landingHeroGradientEnd: '#0099FF',
          landingHeroText: '#FFFFFF',
          landingButtonPrimary: '#FF9900',
          landingButtonPrimaryText: '#FFFFFF',
          landingButtonSecondary: 'transparent',
          landingButtonSecondaryText: '#FFFFFF',
          landingAboutBg: '#F5F7FA',
          landingCoreFeaturesBg: '#F5F7FA',
          landingSystemFeaturesBg: 'linear-gradient(to bottom right, #E3F2FD, #F5F7FA)',
          landingRolesBg: 'linear-gradient(to bottom right, #BBDEFB, #E3F2FD, #F5F7FA)',
          landingWorkflowBg: 'linear-gradient(to bottom right, #F5F7FA, #E3F2FD)',
          landingContactBg: '#E3F2FD',
          loginBgGradientStart: '#F5F7FA',
          loginBgGradientEnd: '#E3F2FD',
          loginCardBg: '#FFFFFF',
          loginButtonBg: '#003366',
          loginButtonText: '#FFFFFF',
          loginButtonHover: '#002244',
          loginAccentBg: '#E3F2FD',
          loginAccentIcon: '#0066CC',
          fontFamily: 'Roboto',
          borderRadiusMedium: '0.25rem',
          spacingScale: 'normal',
          sidebarPosition: 'left'
        }
        setSidebarPosition('left')
        applyTheme(defaultCorporateTheme)
      }
    }

    loadThemeSettings()

    window.addEventListener('storage', loadThemeSettings)

    return () => {
      window.removeEventListener('storage', loadThemeSettings)
    }
  }, [])

  useEffect(() => {
    setIsRightPanelCollapsed(location.pathname !== '/dashboard')
  }, [location.pathname])

  return (
    <div className="h-screen flex flex-col">
      <Topbar onMenu={() => setSidebarOpen(true)} />
      <div className="flex flex-1 overflow-hidden">
        {sidebarPosition === 'left' && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        <main className="flex-1 app-main-content overflow-y-auto">
          <div className="p-4 sm:p-6 lg:p-6">
            {children}
          </div>
          {/* Footer */}
          <footer className="dms-footer border-t border-gray-200 mt-8">
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">
                © 2025 CLB Groups. {t('rights_reserved')}
              </p>
              <div className="flex justify-center gap-4 mt-2 text-xs">
                <a href="#" className="text-blue-600 hover:underline">{t('terms_of_use')}</a>
                <span className="text-gray-400">|</span>
                <a href="#" className="text-blue-600 hover:underline">{t('privacy_policy')}</a>
                <span className="text-gray-400">|</span>
                <a href="#" className="text-blue-600 hover:underline">{t('system_access')}</a>
              </div>
            </div>
          </footer>
        </main>
        {sidebarPosition === 'right' && (
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        )}
        {/* Right Panel - Always available on all pages */}
        <div className={`hidden lg:block transition-all duration-300 ${isRightPanelCollapsed ? 'w-0' : 'w-80'}`}>
          <RightPanel 
            onCollapseChange={setIsRightPanelCollapsed}
            isCollapsed={isRightPanelCollapsed}
          />
        </div>
      </div>
    </div>
  )
}
