import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../contexts/PreferencesContext'
import { normalizeAppPath } from '../utils/normalizeUrl'

export default function Topbar({ onMenu }) {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [logo, setLogo] = useState(null)
  const [companyName, setCompanyName] = useState('FileNix')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [currentUser, setCurrentUser] = useState({ name: 'John Doe', email: 'john.doe@company.com', role: 'Document Controller', department: '', profileImage: null })

  useEffect(() => {
    // Load user from localStorage
    const loadUser = () => {
      const savedUser = localStorage.getItem('user')
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser)
          setCurrentUser({
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'User',
            email: user.email || 'user@company.com',
            role: user.role || 'Document Controller',
            department: user.department || '',
            profileImage: normalizeAppPath(user.profileImage) || null
          })
        } catch (e) {
          console.error('Failed to parse user data', e)
        }
      }
    }

    loadUser()

    // Listen for user profile changes
    const handleUserUpdate = (e) => {
      if (e.key === 'user' || e.key === null) {
        loadUser()
      }
    }

    window.addEventListener('storage', handleUserUpdate)

    // Also listen for custom event for same-tab updates
    window.addEventListener('userProfileUpdated', loadUser)

    return () => {
      window.removeEventListener('storage', handleUserUpdate)
      window.removeEventListener('userProfileUpdated', loadUser)
    }
  }, [])

  useEffect(() => {
    // Load logo from theme settings
    const loadLogo = () => {
      const savedTheme = localStorage.getItem('dms_theme_settings')
      if (savedTheme) {
        try {
          const theme = JSON.parse(savedTheme)
          if (theme.mainLogo) {
            setLogo(theme.mainLogo)
          } else {
            setLogo(null)
          }
        } catch (e) {
          console.error('Failed to parse theme settings', e)
        }
      } else {
        setLogo(null)
      }

      // Load company name from company info
      const savedCompanyInfo = localStorage.getItem('dms_company_info')
      if (savedCompanyInfo) {
        try {
          const companyInfo = JSON.parse(savedCompanyInfo)
          if (companyInfo.companyName) {
            setCompanyName(companyInfo.companyName)
          }
        } catch (e) {
          console.error('Failed to parse company info', e)
        }
      }
    }

    loadLogo()

    // Listen for storage events (theme/company changes)
    window.addEventListener('storage', loadLogo)
    
    return () => {
      window.removeEventListener('storage', loadLogo)
    }
  }, [])

  const handleLogout = () => {
    // Clear all authentication data
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    // Navigate to login page
    navigate('/login')
  }

  const handleSettings = () => {
    navigate('/config')
    setShowUserMenu(false)
  }

  const handleProfile = () => {
    navigate('/profile')
    setShowUserMenu(false)
  }

  // Get user initials
  const getUserInitials = () => {
    const names = currentUser.name.split(' ')
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }
    return currentUser.name.substring(0, 2).toUpperCase()
  }

  return (
    <div className="app-topbar text-white flex items-center justify-between px-4 h-16 shadow-md">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        <button 
          onClick={onMenu} 
          className="md:hidden mr-2 p-2 rounded-lg hover:bg-white/20 transition-colors"
          aria-label="Open menu"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 5h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2zm0 4h14a1 1 0 010 2H3a1 1 0 010-2z" clipRule="evenodd" />
          </svg>
        </button>
        {logo ? (
          <div className="h-10 flex items-center bg-white rounded-lg px-2 shadow-sm">
            <img src={logo} alt="Company Logo" className="max-h-8 max-w-[180px] object-contain" />
          </div>
        ) : (
          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 font-bold shadow-sm">
            {companyName.substring(0, 2).toUpperCase()}
          </div>
        )}
        <div className="hidden md:flex flex-col">
          <span className="text-sm font-semibold">{companyName}</span>
          <span className="text-xs opacity-90">{t('dms_label')}</span>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-white/20 transition-colors"
            aria-label="User menu"
          >
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold text-sm shadow-md overflow-hidden">
              {currentUser.profileImage ? (
                <img src={normalizeAppPath(currentUser.profileImage)} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getUserInitials()
              )}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-sm font-medium leading-tight">{currentUser.name}</div>
              <div className="text-xs opacity-80">{currentUser.department || currentUser.role}</div>
            </div>
            <svg className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showUserMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowUserMenu(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                {/* User Info Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <div className="font-semibold">{currentUser.name}</div>
                  <div className="text-xs opacity-90 mt-0.5">{currentUser.email}</div>
                  {currentUser.department && <div className="text-xs opacity-75 mt-1">{currentUser.department}</div>}
                  <div className="text-xs opacity-75 mt-0.5">{currentUser.role}</div>
                </div>

                {/* Menu Items */}
                <div className="py-2">
                  <button
                    onClick={handleProfile}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-medium">{t('my_profile')}</span>
                  </button>

                  <button
                    onClick={handleSettings}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-3 text-gray-700 transition-colors"
                  >
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-sm font-medium">{t('settings')}</span>
                  </button>

                  <div className="border-t border-gray-200 my-2"></div>

                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 hover:bg-red-50 flex items-center gap-3 text-red-600 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="text-sm font-medium">{t('logout')}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
