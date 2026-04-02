# Complete CMS Customization System
## Configuration > General System > Enhanced CMS Controls

This document provides a comprehensive CMS system to customize:
1. **Landing Page** (Pre-login homepage)
2. **Login Page** (Authentication page)
3. **After-Login/Dashboard** (Post-authentication interface)

---

## NEW Tab Structure for GeneralSystemSettings.jsx

Update the SubTabNavigation component (line 5) to include new tabs:

```jsx
function SubTabNavigation({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'company', label: 'Company Info' },
    { id: 'landing', label: 'Landing Page CMS' },
    { id: 'login', label: 'Login Page CMS' },
    { id: 'dashboard', label: 'Dashboard CMS' },
    { id: 'theme', label: 'Theme & Branding' },
    { id: 'document', label: 'Document Settings' },
    { id: 'notification', label: 'Notification Settings' },
    { id: 'security', label: 'Security' }
  ]
  
  return (
    <div className="border-b border-gray-200 mb-6">
      <nav className="flex space-x-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`py-3 px-3 border-b-2 font-medium text-xs whitespace-nowrap transition-colors ${\r
              activeTab === tab.id\r
                ? 'border-blue-600 text-blue-600'\r
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'\r
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
```

---

## 1. Login Page CMS Component

Add this new component after the LandingPageSettings component:

```jsx
// Tab 3: Login Page CMS
function LoginPageCMS() {
  const [loginSettings, setLoginSettings] = useState({
    // Page Background
    pageBackgroundType: 'gradient', // gradient, solid, image
    pageBgGradientFrom: '#F3F4F6',
    pageBgGradientTo: '#DBEAFE',
    pageBgSolidColor: '#F9FAFB',
    pageBgImage: null,
    pageBgImageOpacity: '0.1',
    
    // Navigation Bar
    navBarEnabled: true,
    navBarBgColor: '#0f6fcf',
    navBarTextColor: '#FFFFFF',
    navBarLogo: null,
    navBarTitle: 'FileNix',
    navBarSubtitle: 'Document Management System',
    navBarShowHome: true,
    navBarShowAbout: true,
    navBarShowFeatures: true,
    navBarShowContact: true,
    
    // Left Side Illustration
    illustrationEnabled: true,
    illustrationType: 'icon', // icon, image, custom
    illustrationIcon: 'document', // document, lock, user, building
    illustrationCustomImage: null,
    illustrationBgColor: '#DBEAFE',
    illustrationIconColor: '#2563EB',
    illustrationTitle: 'Welcome to FileNix',
    illustrationSubtitle: 'Secure Document Management System',
    illustrationTitleColor: '#1F2937',
    illustrationSubtitleColor: '#6B7280',
    
    // Login Card
    cardBgColor: '#FFFFFF',
    cardShadow: 'xl', // none, sm, md, lg, xl, 2xl
    cardBorderRadius: '2xl', // none, sm, md, lg, xl, 2xl, 3xl
    cardPadding: '2rem',
    
    // Logo Section (inside card)
    logoPosition: 'center', // left, center, right
    logoType: 'icon-text', // icon-only, text-only, icon-text, custom-image
    logoCustomImage: null,
    logoIconColor: '#2563EB',
    logoTextColor: '#FFFFFF',
    logoBgColor: '#2563EB',
    logoText: 'FileNix',
    logoSubtext: 'Sign in to access your account',
    logoSubtextColor: '#6B7280',
    
    // Form Fields
    formFieldBorderColor: '#D1D5DB',
    formFieldFocusColor: '#3B82F6',
    formFieldBgColor: '#FFFFFF',
    formFieldTextColor: '#111827',
    formFieldPlaceholderColor: '#9CA3AF',
    formFieldBorderRadius: '0.5rem',
    formFieldHeight: '3rem',
    formFieldShowIcons: true,
    formFieldIconColor: '#6B7280',
    
    // Labels
    labelTextColor: '#374151',
    labelFontWeight: '500',
    labelFontSize: '0.875rem',
    
    // Buttons
    loginButtonBgColor: '#2563EB',
    loginButtonTextColor: '#FFFFFF',
    loginButtonHoverColor: '#1D4ED8',
    loginButtonBorderRadius: '0.5rem',
    loginButtonHeight: '3rem',
    loginButtonFontSize: '1rem',
    loginButtonFontWeight: '600',
    
    // Additional Links
    rememberMeEnabled: true,
    rememberMeTextColor: '#374151',
    forgotPasswordEnabled: true,
    forgotPasswordTextColor: '#2563EB',
    forgotPasswordHoverColor: '#1D4ED8',
    
    // Footer
    footerEnabled: true,
    footerBgColor: '#FFFFFF',
    footerTextColor: '#6B7280',
    footerBorderColor: '#E5E7EB',
    footerCopyright: '© 2025 CLB Groups. All rights reserved.',
    footerLinks: [
      { label: 'Terms of Use', url: '#', enabled: true },
      { label: 'Privacy Policy', url: '#', enabled: true },
      { label: 'System Access', url: '#', enabled: true }
    ]
  })

  useEffect(() => {
    const saved = localStorage.getItem('dms_login_page_settings')
    if (saved) {
      const parsed = JSON.parse(saved)
      setLoginSettings(prev => ({ ...prev, ...parsed }))
    }
  }, [])

  const handleSave = () => {
    localStorage.setItem('dms_login_page_settings', JSON.stringify(loginSettings))
    alert('Login page settings saved successfully!')
  }

  const handleImageUpload = (field, event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLoginSettings(prev => ({ ...prev, [field]: reader.result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleAddFooterLink = () => {
    setLoginSettings(prev => ({
      ...prev,
      footerLinks: [...prev.footerLinks, { label: '', url: '#', enabled: true }]
    }))
  }

  const handleRemoveFooterLink = (index) => {
    setLoginSettings(prev => ({
      ...prev,
      footerLinks: prev.footerLinks.filter((_, i) => i !== index)
    }))
  }

  const handleFooterLinkChange = (index, field, value) => {
    setLoginSettings(prev => ({
      ...prev,
      footerLinks: prev.footerLinks.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }))
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Login Page Customization</h3>
        <p className="text-sm text-gray-600 mt-1">Customize every aspect of your login page design and content</p>
      </div>

      {/* Page Background */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Page Background</h4>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Background Type</label>
            <select
              value={loginSettings.pageBackgroundType}
              onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBackgroundType: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
            >
              <option value="gradient">Gradient</option>
              <option value="solid">Solid Color</option>
              <option value="image">Background Image</option>
            </select>
          </div>

          {loginSettings.pageBackgroundType === 'gradient' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Gradient From</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={loginSettings.pageBgGradientFrom}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBgGradientFrom: e.target.value }))}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={loginSettings.pageBgGradientFrom}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBgGradientFrom: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Gradient To</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={loginSettings.pageBgGradientTo}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBgGradientTo: e.target.value }))}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={loginSettings.pageBgGradientTo}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBgGradientTo: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {loginSettings.pageBackgroundType === 'solid' && (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.pageBgSolidColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBgSolidColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.pageBgSolidColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBgSolidColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
          )}

          {loginSettings.pageBackgroundType === 'image' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Background Image</label>
                {loginSettings.pageBgImage && (
                  <div className="mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                    ✓ Image uploaded
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload('pageBgImage', e)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {loginSettings.pageBgImage && (
                  <button
                    onClick={() => setLoginSettings(prev => ({ ...prev, pageBgImage: null }))}
                    className="mt-2 w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                  >
                    Remove Image
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Image Opacity</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={loginSettings.pageBgImageOpacity}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, pageBgImageOpacity: e.target.value }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-600">{(parseFloat(loginSettings.pageBgImageOpacity) * 100).toFixed(0)}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Navigation Bar</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={loginSettings.navBarEnabled}
              onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarEnabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-900">Enable Navigation Bar</span>
          </label>

          {loginSettings.navBarEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={loginSettings.navBarBgColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarBgColor: e.target.value }))}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={loginSettings.navBarBgColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarBgColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={loginSettings.navBarTextColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarTextColor: e.target.value }))}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={loginSettings.navBarTextColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarTextColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                  <input
                    type="text"
                    value={loginSettings.navBarTitle}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarTitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Subtitle</label>
                  <input
                    type="text"
                    value={loginSettings.navBarSubtitle}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarSubtitle: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-3">Navigation Links</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={loginSettings.navBarShowHome}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarShowHome: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Home</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={loginSettings.navBarShowAbout}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarShowAbout: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">About</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={loginSettings.navBarShowFeatures}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarShowFeatures: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Features</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={loginSettings.navBarShowContact}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, navBarShowContact: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700">Contact</span>
                  </label>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Left Side Illustration */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Left Side Illustration (Desktop Only)</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={loginSettings.illustrationEnabled}
              onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationEnabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-900">Enable Illustration</span>
          </label>

          {loginSettings.illustrationEnabled && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Illustration Type</label>
                <select
                  value={loginSettings.illustrationType}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationType: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                >
                  <option value="icon">Icon</option>
                  <option value="image">Custom Image</option>
                </select>
              </div>

              {loginSettings.illustrationType === 'icon' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Icon Type</label>
                      <select
                        value={loginSettings.illustrationIcon}
                        onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationIcon: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
                      >
                        <option value="document">Document</option>
                        <option value="lock">Lock/Security</option>
                        <option value="user">User/Profile</option>
                        <option value="building">Building/Company</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={loginSettings.illustrationBgColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationBgColor: e.target.value }))}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={loginSettings.illustrationBgColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationBgColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Icon Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={loginSettings.illustrationIconColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationIconColor: e.target.value }))}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={loginSettings.illustrationIconColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationIconColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Title</label>
                      <input
                        type="text"
                        value={loginSettings.illustrationTitle}
                        onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationTitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Subtitle</label>
                      <input
                        type="text"
                        value={loginSettings.illustrationSubtitle}
                        onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationSubtitle: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Title Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={loginSettings.illustrationTitleColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationTitleColor: e.target.value }))}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={loginSettings.illustrationTitleColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationTitleColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">Subtitle Color</label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={loginSettings.illustrationSubtitleColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationSubtitleColor: e.target.value }))}
                          className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                        />
                        <input
                          type="text"
                          value={loginSettings.illustrationSubtitleColor}
                          onChange={(e) => setLoginSettings(prev => ({ ...prev, illustrationSubtitleColor: e.target.value }))}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}

              {loginSettings.illustrationType === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Custom Image</label>
                  {loginSettings.illustrationCustomImage && (
                    <div className="mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                      ✓ Image uploaded
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload('illustrationCustomImage', e)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {loginSettings.illustrationCustomImage && (
                    <button
                      onClick={() => setLoginSettings(prev => ({ ...prev, illustrationCustomImage: null }))}
                      className="mt-2 w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                    >
                      Remove Image
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Continued in next sections...  */}
      {/* This is Part 1 of Login Page CMS */}
    </div>
  )
}
```

---

## Part 2 of Login Page CMS (continue inside same component)

```jsx
      {/* Login Card Design */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Login Card Design</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.cardBgColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, cardBgColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.cardBgColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, cardBgColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Shadow Size</label>
              <select
                value={loginSettings.cardShadow}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, cardShadow: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
                <option value="2xl">2X Large</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Border Radius</label>
              <select
                value={loginSettings.cardBorderRadius}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, cardBorderRadius: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="none">None</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
                <option value="2xl">2X Large</option>
                <option value="3xl">3X Large</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">Card Padding</label>
            <input
              type="text"
              value={loginSettings.cardPadding}
              onChange={(e) => setLoginSettings(prev => ({ ...prev, cardPadding: e.target.value }))}
              placeholder="2rem"
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg outline-none"
            />
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Logo Section (Inside Card)</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Logo Position</label>
              <select
                value={loginSettings.logoPosition}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, logoPosition: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Logo Type</label>
              <select
                value={loginSettings.logoType}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, logoType: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none bg-white"
              >
                <option value="icon-text">Icon + Text</option>
                <option value="icon-only">Icon Only</option>
                <option value="text-only">Text Only</option>
                <option value="custom-image">Custom Image</option>
              </select>
            </div>
          </div>

          {loginSettings.logoType === 'custom-image' ? (
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Custom Logo Image</label>
              {loginSettings.logoCustomImage && (
                <div className="mb-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
                  ✓ Logo uploaded
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload('logoCustomImage', e)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none file:mr-2 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              {loginSettings.logoCustomImage && (
                <button
                  onClick={() => setLoginSettings(prev => ({ ...prev, logoCustomImage: null }))}
                  className="mt-2 w-full px-3 py-2 text-sm text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                >
                  Remove Logo
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(loginSettings.logoType === 'icon-text' || loginSettings.logoType === 'icon-only') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Icon Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={loginSettings.logoIconColor}
                        onChange={(e) => setLoginSettings(prev => ({ ...prev, logoIconColor: e.target.value }))}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={loginSettings.logoIconColor}
                        onChange={(e) => setLoginSettings(prev => ({ ...prev, logoIconColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                )}
                {(loginSettings.logoType === 'icon-text' || loginSettings.logoType === 'text-only') && (
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Text Color</label>
                    <div className="flex gap-2">
                      <input
                        type="color"
                        value={loginSettings.logoTextColor}
                        onChange={(e) => setLoginSettings(prev => ({ ...prev, logoTextColor: e.target.value }))}
                        className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={loginSettings.logoTextColor}
                        onChange={(e) => setLoginSettings(prev => ({ ...prev, logoTextColor: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={loginSettings.logoBgColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, logoBgColor: e.target.value }))}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={loginSettings.logoBgColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, logoBgColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              {(loginSettings.logoType === 'icon-text' || loginSettings.logoType === 'text-only') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Logo Text</label>
                    <input
                      type="text"
                      value={loginSettings.logoText}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, logoText: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Subtext</label>
                    <input
                      type="text"
                      value={loginSettings.logoSubtext}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, logoSubtext: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Subtext Color</label>
                <div className="flex gap-2 w-full md:w-1/2">
                  <input
                    type="color"
                    value={loginSettings.logoSubtextColor}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, logoSubtextColor: e.target.value }))}
                    className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={loginSettings.logoSubtextColor}
                    onChange={(e) => setLoginSettings(prev => ({ ...prev, logoSubtextColor: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Form Fields Styling */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Form Fields Styling</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={loginSettings.formFieldShowIcons}
              onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldShowIcons: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-900">Show Input Icons</span>
          </label>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Border Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.formFieldBorderColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldBorderColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.formFieldBorderColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldBorderColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Focus Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.formFieldFocusColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldFocusColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.formFieldFocusColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldFocusColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.formFieldBgColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldBgColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.formFieldBgColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldBgColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Border Radius</label>
              <input
                type="text"
                value={loginSettings.formFieldBorderRadius}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldBorderRadius: e.target.value }))}
                placeholder="0.5rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Field Height</label>
              <input
                type="text"
                value={loginSettings.formFieldHeight}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, formFieldHeight: e.target.value }))}
                placeholder="3rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Login Button */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Login Button Styling</h4>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.loginButtonBgColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonBgColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.loginButtonBgColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonBgColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Text Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.loginButtonTextColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonTextColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.loginButtonTextColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonTextColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Hover Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={loginSettings.loginButtonHoverColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonHoverColor: e.target.value }))}
                  className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={loginSettings.loginButtonHoverColor}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonHoverColor: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Border Radius</label>
              <input
                type="text"
                value={loginSettings.loginButtonBorderRadius}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonBorderRadius: e.target.value }))}
                placeholder="0.5rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Button Height</label>
              <input
                type="text"
                value={loginSettings.loginButtonHeight}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonHeight: e.target.value }))}
                placeholder="3rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-900 mb-2">Font Size</label>
              <input
                type="text"
                value={loginSettings.loginButtonFontSize}
                onChange={(e) => setLoginSettings(prev => ({ ...prev, loginButtonFontSize: e.target.value }))}
                placeholder="1rem"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-4">Footer Section</h4>
        <div className="space-y-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={loginSettings.footerEnabled}
              onChange={(e) => setLoginSettings(prev => ({ ...prev, footerEnabled: e.target.checked }))}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm font-medium text-gray-900">Enable Footer</span>
          </label>

          {loginSettings.footerEnabled && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Background Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={loginSettings.footerBgColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, footerBgColor: e.target.value }))}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={loginSettings.footerBgColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, footerBgColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Text Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={loginSettings.footerTextColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, footerTextColor: e.target.value }))}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={loginSettings.footerTextColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, footerTextColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Border Color</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={loginSettings.footerBorderColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, footerBorderColor: e.target.value }))}
                      className="w-16 h-10 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={loginSettings.footerBorderColor}
                      onChange={(e) => setLoginSettings(prev => ({ ...prev, footerBorderColor: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">Copyright Text</label>
                <input
                  type="text"
                  value={loginSettings.footerCopyright}
                  onChange={(e) => setLoginSettings(prev => ({ ...prev, footerCopyright: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-900">Footer Links</label>
                  <button
                    onClick={handleAddFooterLink}
                    className="text-xs text-blue-600 hover:text-blue-700"
                  >
                    + Add Link
                  </button>
                </div>
                <div className="space-y-3">
                  {loginSettings.footerLinks.map((link, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                      <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-4">
                          <input
                            type="text"
                            value={link.label}
                            onChange={(e) => handleFooterLinkChange(idx, 'label', e.target.value)}
                            placeholder="Link Label"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-5">
                          <input
                            type="text"
                            value={link.url}
                            onChange={(e) => handleFooterLinkChange(idx, 'url', e.target.value)}
                            placeholder="URL or #"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none"
                          />
                        </div>
                        <div className="col-span-2 flex items-center justify-center">
                          <label className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={link.enabled}
                              onChange={(e) => handleFooterLinkChange(idx, 'enabled', e.target.checked)}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span className="text-xs text-gray-700">Show</span>
                          </label>
                        </div>
                        <div className="col-span-1 flex items-center justify-center">
                          <button
                            onClick={() => handleRemoveFooterLink(idx)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Save Login Page Settings
        </button>
      </div>
    </div>
  )
}
```

This is a comprehensive CMS system. Due to length, I'll create a separate document for:
- **Dashboard CMS Component** (for after-login customization)
- **Integration instructions**
- **CSS variables and application logic**

Would you like me to continue with the Dashboard CMS and complete integration instructions?

