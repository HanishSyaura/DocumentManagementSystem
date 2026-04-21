import React, { useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import { usePreferences } from '../contexts/PreferencesContext'
import { applyTheme } from '../utils/branding'
import GettingStartedModal from './GettingStartedModal'
import { isAdmin } from '../utils/permissions'
import GuidedTour from './GuidedTour'
import UploadProgressBar from './UploadProgressBar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()
  const { t } = usePreferences()
  const [sidebarPosition, setSidebarPosition] = useState('left')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem('dms_sidebar_collapsed') === '1'
    } catch {
      return false
    }
  })
  const [footerConfig, setFooterConfig] = useState(null)
  const [gettingStartedOpen, setGettingStartedOpen] = useState(false)
  const [showAdminGuide, setShowAdminGuide] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)
  const [tourId, setTourId] = useState('user')
  const [showGettingStartedHint, setShowGettingStartedHint] = useState(false)
  // Right panel is collapsed by default on all pages except dashboard
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(location.pathname !== '/dashboard')

  useLayoutEffect(() => {
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
    window.addEventListener('brandingUpdated', loadThemeSettings)

    return () => {
      window.removeEventListener('storage', loadThemeSettings)
      window.removeEventListener('brandingUpdated', loadThemeSettings)
    }
  }, [])

  useEffect(() => {
    setIsRightPanelCollapsed(location.pathname !== '/dashboard')
  }, [location.pathname])

  useEffect(() => {
    const loadFooterConfig = () => {
      try {
        const raw = localStorage.getItem('dms_landing_page_settings')
        if (!raw) {
          setFooterConfig(null)
          return
        }
        const parsed = JSON.parse(raw)
        if (!parsed || typeof parsed !== 'object') {
          setFooterConfig(null)
          return
        }
        setFooterConfig(parsed)
      } catch {
        setFooterConfig(null)
      }
    }

    loadFooterConfig()
    window.addEventListener('storage', loadFooterConfig)
    return () => window.removeEventListener('storage', loadFooterConfig)
  }, [])

  useEffect(() => {
    setShowAdminGuide(isAdmin())
    try {
      const raw = localStorage.getItem('user')
      const user = raw ? JSON.parse(raw) : null
      const key = `dms_getting_started_seen_${user?.id || 'anon'}`
      const seen = localStorage.getItem(key)
      if (!seen) {
        setGettingStartedOpen(true)
        setShowGettingStartedHint(true)
      }
    } catch {
      setGettingStartedOpen(true)
      setShowGettingStartedHint(true)
    }
  }, [])

  const startTour = (id) => {
    setTourId(id === 'admin' ? 'admin' : 'user')
    setTourOpen(true)
    setShowGettingStartedHint(false)
  }

  const footerLinks = Array.isArray(footerConfig?.footerLinks) ? footerConfig.footerLinks : []
  const footerCopyright = footerConfig?.copyrightText

  return (
    <div className="h-screen flex flex-col">
      <UploadProgressBar />
      <Topbar
        onMenu={() => setSidebarOpen(true)}
        onGettingStarted={() => {
          setGettingStartedOpen(true)
          setShowGettingStartedHint(false)
        }}
        showGettingStartedHint={showGettingStartedHint}
      />
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarPosition === 'left' && (
          <div className="relative">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              isCollapsed={sidebarCollapsed}
            />
            <button
              type="button"
              onClick={() => {
                setSidebarCollapsed((prev) => {
                  const next = !prev
                  try {
                    localStorage.setItem('dms_sidebar_collapsed', next ? '1' : '0')
                  } catch {
                  }
                  return next
                })
              }}
              className="hidden md:flex items-center justify-center absolute -right-3 bottom-20 bg-white shadow-lg rounded-full w-7 h-7 z-30 hover:bg-gray-50 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? 'M13 5l7 7-7 7M4 5h2v14H4z' : 'M11 19l-7-7 7-7M20 5h-2v14h2z'} />
              </svg>
            </button>
          </div>
        )}
        <main className="flex-1 min-h-0 app-main-content overflow-y-auto">
          <div className="p-3 sm:p-4 lg:p-6">
            <GettingStartedModal
              open={gettingStartedOpen}
              showAdminGuide={showAdminGuide}
              onStartTour={startTour}
              onClose={() => {
                try {
                  const raw = localStorage.getItem('user')
                  const user = raw ? JSON.parse(raw) : null
                  const key = `dms_getting_started_seen_${user?.id || 'anon'}`
                  localStorage.setItem(key, '1')
                } catch {
                }
                setGettingStartedOpen(false)
                setShowGettingStartedHint(false)
              }}
            />
            <GuidedTour
              open={tourOpen}
              tourId={tourId}
              onClose={({ completed } = {}) => {
                if (completed) {
                  try {
                    const raw = localStorage.getItem('user')
                    const user = raw ? JSON.parse(raw) : null
                    const key = `dms_getting_started_tour_done_${user?.id || 'anon'}_${tourId}`
                    localStorage.setItem(key, '1')
                  } catch {
                  }
                }
                setTourOpen(false)
              }}
            />
            {children}
          </div>
          {/* Footer */}
          <footer className="dms-footer border-t border-gray-200 mt-8">
            <div className="text-center py-4">
              <p className="text-xs text-gray-500">
                {footerCopyright || `© 2025 CLB Groups. ${t('rights_reserved')}`}
              </p>
              {footerLinks.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs">
                  {footerLinks.map((link, idx) => (
                    <React.Fragment key={idx}>
                      {idx > 0 && <span className="text-gray-400 hidden sm:inline">|</span>}
                      <button
                        type="button"
                        onClick={() => { if (link?.pdf) window.open(link.pdf, '_blank', 'noopener,noreferrer') }}
                        className="text-blue-600 hover:underline disabled:text-gray-400 disabled:hover:no-underline"
                        disabled={!link?.pdf}
                      >
                        {link?.label || ''}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </footer>
        </main>
        {sidebarPosition === 'right' && (
          <div className="relative">
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
              isCollapsed={sidebarCollapsed}
            />
            <button
              type="button"
              onClick={() => {
                setSidebarCollapsed((prev) => {
                  const next = !prev
                  try {
                    localStorage.setItem('dms_sidebar_collapsed', next ? '1' : '0')
                  } catch {
                  }
                  return next
                })
              }}
              className="hidden md:flex items-center justify-center absolute -left-3 bottom-20 bg-white shadow-lg rounded-full w-7 h-7 z-30 hover:bg-gray-50 transition-colors"
              aria-label="Toggle sidebar"
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={sidebarCollapsed ? 'M11 19l-7-7 7-7M20 5h-2v14h2z' : 'M13 5l7 7-7 7M4 5h2v14H4z'} />
              </svg>
            </button>
          </div>
        )}
        {/* Right Panel - Always available on all pages */}
        <div className={`hidden xl:block transition-all duration-300 ${isRightPanelCollapsed ? 'w-0' : 'w-64 xl:w-72 2xl:w-80'}`}>
          <RightPanel 
            onCollapseChange={setIsRightPanelCollapsed}
            isCollapsed={isRightPanelCollapsed}
          />
        </div>
      </div>
    </div>
  )
}
