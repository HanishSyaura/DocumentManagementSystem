import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePreferences } from '../contexts/PreferencesContext';
import {
  DocumentTextIcon,
  ClockIcon,
  ArchiveBoxIcon,
  DocumentDuplicateIcon,
  ShieldCheckIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EnvelopeIcon,
  PhoneIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../api/axios';
import MarkdownRenderer from './MarkdownRenderer';

const iconMap = {
  'document-text': DocumentTextIcon,
  'clock': ClockIcon,
  'archive': ArchiveBoxIcon,
  'document-duplicate': DocumentDuplicateIcon,
  'shield-check': ShieldCheckIcon,
  'bell': BellIcon,
  'clipboard-list': ClipboardDocumentListIcon,
  'chart-bar': ChartBarIcon,
};

const HomePage = () => {
  const navigate = useNavigate();
  const { t } = usePreferences();
  const [features, setFeatures] = useState(null);
  const [loading, setLoading] = useState(true);
  const [landingContent, setLandingContent] = useState(null);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    organizationType: 'Other'
  });
  const [submitStatus, setSubmitStatus] = useState(null);
  const [pdfModal, setPdfModal] = useState({ isOpen: false, pdfData: null, title: '' });
  const [logo, setLogo] = useState(null);
  const [companyName, setCompanyName] = useState('FileNix');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isHexColor = (v) => typeof v === 'string' && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v)
  const rolesList = Array.isArray(landingContent?.roles) ? landingContent.roles : []
  const rolesByPosition = rolesList.reduce((acc, r) => {
    const pos = typeof r?.position === 'string' ? r.position : ''
    if (pos) acc[pos] = r
    return acc
  }, {})
  const roleFor = (pos, fallback) => {
    const r = rolesByPosition[pos]
    if (r && typeof r === 'object') return { ...fallback, ...r }
    return fallback
  }
  const roleCenter = roleFor('center', { name: t('hp_admin'), description: t('hp_admin_desc') })
  const roleTop = roleFor('top', { name: t('hp_doc_controller'), description: t('hp_doc_controller_desc') })
  const roleBottom = roleFor('bottom', { name: t('hp_doc_owner'), description: t('hp_doc_owner_desc') })
  const roleLeft = roleFor('left', { name: t('hp_reviewer'), description: t('hp_reviewer_desc') })
  const roleRight = roleFor('right', { name: t('hp_approver'), description: t('hp_approver_desc') })

  const contactEmailsRaw = Array.isArray(landingContent?.contactEmails) ? landingContent.contactEmails : []
  const contactEmails = contactEmailsRaw.map(e => (typeof e === 'string' ? e.trim() : '')).filter(Boolean)
  const effectiveContactEmails = contactEmails.length ? contactEmails : ['hanish@clbgroups.com', 'khairul@clbgroups.com']
  const contactPhoneText = typeof landingContent?.contactPhone === 'string' && landingContent.contactPhone.trim()
    ? landingContent.contactPhone.trim()
    : '+60 19-6653453'
  const contactPhoneHref = `tel:${contactPhoneText.replace(/[^\d+]/g, '')}`

  const workflowSteps = Array.isArray(landingContent?.workflowSteps) && landingContent.workflowSteps.length
    ? landingContent.workflowSteps
    : [
        { step: t('hp_step1'), color: 'cyan' },
        { step: t('hp_step2'), color: 'blue' },
        { step: t('hp_step3'), color: 'purple' },
        { step: t('hp_step4'), color: 'indigo' },
        { step: t('hp_step5'), color: 'orange' },
        { step: t('hp_step6'), color: 'green' },
        { step: t('hp_step7'), color: 'emerald' }
      ]
  const workflowStyleMap = {
    cyan: { from: 'from-cyan-400', to: 'to-cyan-600', border: 'border-cyan-500', badgeFrom: 'from-cyan-400', badgeTo: 'to-cyan-600' },
    blue: { from: 'from-blue-500', to: 'to-blue-700', border: 'border-blue-600', badgeFrom: 'from-blue-500', badgeTo: 'to-blue-700' },
    purple: { from: 'from-purple-500', to: 'to-purple-700', border: 'border-purple-600', badgeFrom: 'from-purple-500', badgeTo: 'to-purple-700' },
    indigo: { from: 'from-indigo-500', to: 'to-indigo-700', border: 'border-indigo-600', badgeFrom: 'from-indigo-500', badgeTo: 'to-indigo-700' },
    orange: { from: 'from-orange-500', to: 'to-orange-700', border: 'border-orange-600', badgeFrom: 'from-orange-500', badgeTo: 'to-orange-700' },
    green: { from: 'from-green-500', to: 'to-green-700', border: 'border-green-600', badgeFrom: 'from-green-500', badgeTo: 'to-green-700' },
    emerald: { from: 'from-emerald-500', to: 'to-teal-600', border: 'border-emerald-600', badgeFrom: 'from-emerald-500', badgeTo: 'to-teal-600' },
    teal: { from: 'from-teal-500', to: 'to-teal-700', border: 'border-teal-600', badgeFrom: 'from-teal-500', badgeTo: 'to-teal-700' },
    gray: { from: 'from-gray-500', to: 'to-gray-700', border: 'border-gray-600', badgeFrom: 'from-gray-500', badgeTo: 'to-gray-700' }
  }
  const workflowPalette = ['cyan', 'blue', 'purple', 'indigo', 'orange', 'green', 'emerald']
  const workflowStyleFor = (color, idx) => {
    const c = typeof color === 'string' ? color : ''
    return workflowStyleMap[c] || workflowStyleMap[workflowPalette[idx % workflowPalette.length]]
  }

  useEffect(() => {
    fetchFeatures();
    loadLandingContent();
    loadBranding();
    window.addEventListener('storage', loadBranding)
    return () => {
      window.removeEventListener('storage', loadBranding)
    }
  }, []);

  const loadLandingContent = async () => {
    try {
      const response = await api.get('/public/landing-page-settings');
      const serverSettings = response.data?.data?.settings;
      if (serverSettings && typeof serverSettings === 'object') {
        setLandingContent(serverSettings);
        try {
          localStorage.setItem('dms_landing_page_settings', JSON.stringify(serverSettings));
        } catch {}
        return;
      }
    } catch {}

    try {
      const saved = localStorage.getItem('dms_landing_page_settings');
      if (saved) {
        setLandingContent(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading landing page content:', error);
    }
  };

  const loadBranding = async () => {
    try {
      const res = await api.get('/public/branding')
      const companyInfo = res.data?.data?.companyInfo
      const theme = res.data?.data?.theme
      if (theme?.mainLogo) setLogo(theme.mainLogo)
      if (companyInfo?.companyName) setCompanyName(companyInfo.companyName)
      try {
        if (theme) localStorage.setItem('dms_theme_settings', JSON.stringify(theme))
        if (companyInfo) localStorage.setItem('dms_company_info', JSON.stringify(companyInfo))
      } catch {}
      return
    } catch {}

    const savedTheme = localStorage.getItem('dms_theme_settings');
    if (savedTheme) {
      try {
        const theme = JSON.parse(savedTheme);
        if (theme.mainLogo) {
          setLogo(theme.mainLogo);
        }
      } catch (e) {
        console.error('Failed to parse theme settings', e);
      }
    }

    const savedCompanyInfo = localStorage.getItem('dms_company_info');
    if (savedCompanyInfo) {
      try {
        const companyInfo = JSON.parse(savedCompanyInfo);
        if (companyInfo.companyName) {
          setCompanyName(companyInfo.companyName);
        }
      } catch (e) {
        console.error('Failed to parse company info', e);
      }
    }
  };

  const fetchFeatures = async () => {
    try {
      const response = await api.get('/public/features');
      if (response.data.success) {
        setFeatures(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching features:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setSubmitStatus('submitting');

    try {
      const response = await api.post('/public/contact', contactForm);

      if (response.data.success) {
        setSubmitStatus('success');
        setContactForm({
          name: '',
          email: '',
          subject: '',
          message: '',
          organizationType: 'Other'
        });
        setTimeout(() => setSubmitStatus(null), 5000);
      }
    } catch (error) {
      console.error('Error submitting contact form:', error);
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus(null), 5000);
    }
  };

  const handleInputChange = (e) => {
    setContactForm({
      ...contactForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePdfLinkClick = (link) => {
    if (link.pdf) {
      setPdfModal({ isOpen: true, pdfData: link.pdf, title: link.label });
    }
  };

  const closePdfModal = () => {
    setPdfModal({ isOpen: false, pdfData: null, title: '' });
  };

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (pdfModal.isOpen) closePdfModal();
        if (mobileMenuOpen) setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pdfModal.isOpen, mobileMenuOpen]);

  useEffect(() => {
    if (!pdfModal.isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [pdfModal.isOpen]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
        <p className="text-gray-600 font-medium">{t('hp_loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white scroll-smooth">
      <a href="#main" className="skip-link">Skip to content</a>
      {/* Navigation Bar */}
      <nav className="app-topbar sticky top-0 z-50 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button type="button" className="flex items-center gap-3 focus-visible:outline-none" onClick={() => navigate('/')} aria-label="Go to home">
              {logo ? (
                <div className="h-10 flex items-center bg-white rounded-lg px-2 shadow-sm">
                  <img src={logo} alt="Company Logo" className="max-h-8 max-w-[180px] object-contain" />
                </div>
              ) : (
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <DocumentTextIcon className="h-6 w-6" style={{color: 'var(--dms-primary, #0f6fcf)'}} />
                </div>
              )}
              <div className="hidden md:flex flex-col">
                <span className="text-sm font-semibold">{companyName}</span>
                <span className="text-xs opacity-90">{t('dms_label')}</span>
              </div>
            </button>
            <div className="hidden md:flex items-center space-x-1">
              <a href="#home" className="text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_home')}
              </a>
              <a href="#about" className="text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_about')}
              </a>
              <a href="#features" className="text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_features')}
              </a>
              <a href="#workflow" className="text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                Overview
              </a>
              <a href="#contact" className="text-white hover:bg-white/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_contact')}
              </a>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold ml-2 hover:bg-blue-50 transition-colors"
              >
                {t('hp_login')}
              </button>
            </div>
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg hover:bg-white/20 transition-colors"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="landing-mobile-nav"
              onClick={() => setMobileMenuOpen(v => !v)}
            >
              {mobileMenuOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen && (
          <div id="landing-mobile-nav" className="md:hidden border-t border-white/15 bg-[color:var(--dms-primary)]">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-2">
              <a href="#home" onClick={() => setMobileMenuOpen(false)} className="text-white/95 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_home')}
              </a>
              <a href="#about" onClick={() => setMobileMenuOpen(false)} className="text-white/95 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_about')}
              </a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-white/95 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_features')}
              </a>
              <a href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-white/95 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                Overview
              </a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className="text-white/95 hover:bg-white/15 px-3 py-2 rounded-lg text-sm font-medium transition-colors">
                {t('hp_contact')}
              </a>
              <button
                type="button"
                onClick={() => { setMobileMenuOpen(false); navigate('/login'); }}
                className="mt-1 bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition-colors"
              >
                {t('hp_login')}
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <main id="main" tabIndex={-1}>
      <section id="home" className="scroll-mt-20 min-h-[calc(100svh-4rem)] flex items-center overflow-hidden" style={{
        background: `linear-gradient(to right, var(--dms-landing-hero-start, #2563EB), var(--dms-landing-hero-mid, #3B82F6), var(--dms-landing-hero-end, #06B6D4))`,
        color: 'var(--dms-landing-hero-text, #FFFFFF)'
      }}> 
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Text Content */}
            <div className={`animate-fade-in-up ${landingContent?.heroImage && landingContent?.heroImagePosition === 'right' ? 'md:order-1' : 'md:order-2'}`}>
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 sm:mb-8 leading-tight animate-slide-in-left">
                <MarkdownRenderer inline value={landingContent?.heroHeadline || 'Centralized Control for Your Documents'} />
              </h1>
              <MarkdownRenderer
                value={landingContent?.heroSubheadline || 'A unified system to create, review, approve, and publish all organizational documents — securely and efficiently.'}
                className="text-lg sm:text-xl lg:text-2xl mb-8 sm:mb-10 leading-relaxed opacity-95 space-y-3"
              />
              <div className="flex flex-col sm:flex-row flex-wrap gap-4 sm:gap-5">
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold hover:shadow-2xl transition-all transform hover:scale-105 hover:-translate-y-1"
                  style={{backgroundColor: 'var(--dms-landing-btn-primary, #FFFFFF)', color: 'var(--dms-landing-btn-primary-text, #2563EB)'}}
                >
                  {t('hp_log_in_now')}
                </button>
                <a
                  href="#about"
                  className="border-2 px-8 sm:px-10 py-3.5 sm:py-4 rounded-xl text-base sm:text-lg font-bold transition-all transform hover:scale-105 text-center"
                  style={{backgroundColor: 'var(--dms-landing-btn-secondary, transparent)', borderColor: 'var(--dms-landing-btn-secondary-text, #FFFFFF)', color: 'var(--dms-landing-btn-secondary-text, #FFFFFF)'}}
                >
                  {t('hp_learn_more')}
                </a>
              </div>
            </div>
            
            {/* Image */}
            <div className={`hidden md:flex justify-center animate-fade-in ${landingContent?.heroImage && landingContent?.heroImagePosition === 'right' ? 'md:order-2' : 'md:order-1'}`}>
              <div className="relative">
                {landingContent?.heroImage ? (
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 sm:p-6 lg:p-8 rounded-2xl hover:scale-105 transition-transform duration-500">
                    <img src={landingContent.heroImage} alt="Hero" className="max-w-full h-auto w-auto max-h-[22rem] sm:max-h-[24rem] lg:max-h-[28rem] object-contain" />
                  </div>
                ) : (
                  <div className="bg-white bg-opacity-20 backdrop-blur-sm p-12 lg:p-16 rounded-2xl hover:scale-105 transition-transform duration-500">
                    <DocumentTextIcon className="h-48 w-48 lg:h-72 lg:w-72 text-white opacity-90" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What is DMS Section */}
      <section id="about" className="scroll-mt-20 py-16 sm:py-20" style={{backgroundColor: 'var(--dms-landing-about-bg, #F9FAFB)'}}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              <MarkdownRenderer inline value={landingContent?.aboutTitle || t('hp_what_is_dms')} />
            </h2>
            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-cyan-600 mx-auto rounded-full"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Image */}
            <div className={`flex justify-center order-2 ${landingContent?.aboutImage && landingContent?.aboutImagePosition === 'right' ? 'md:order-2' : 'md:order-1'}`}>
              <div className="relative group">
                {landingContent?.aboutImage ? (
                  <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-3xl shadow-2xl transform hover:scale-105 transition-all duration-500">
                    <img src={landingContent.aboutImage} alt="About DMS" className="max-w-full h-auto w-auto max-h-[18rem] sm:max-h-[22rem] lg:max-h-[26rem] object-contain" />
                  </div>
                ) : (
                  <>
                    <div 
                      className="absolute inset-0 rounded-3xl blur-2xl opacity-50 group-hover:opacity-75 transition-opacity"
                      style={{background: `linear-gradient(to bottom right, var(--dms-landing-hero-mid, #3B82F6), var(--dms-landing-hero-end, #06B6D4))`}}
                    ></div>
                    <div 
                      className="relative p-12 sm:p-16 lg:p-20 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-500 cursor-pointer"
                      style={{background: `linear-gradient(to bottom right, var(--dms-landing-hero-mid, #3B82F6), var(--dms-landing-hero-end, #06B6D4))`}}
                    >
                      <DocumentDuplicateIcon className="h-40 w-40 sm:h-48 sm:w-48 lg:h-56 lg:w-56 text-white animate-float" />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Description */}
            <div className={`order-1 ${landingContent?.aboutImage && landingContent?.aboutImagePosition === 'right' ? 'md:order-1' : 'md:order-2'}`}>
              <div className="bg-white p-8 sm:p-10 lg:p-12 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 border-2 border-gray-100 hover:border-blue-300">
                <MarkdownRenderer
                  value={landingContent?.aboutDescription || 'The **Document Management System (DMS)** is designed to standardize and digitalize our document lifecycle — from creation to publication and archiving.'}
                  className="text-xl sm:text-2xl lg:text-3xl text-gray-800 leading-relaxed mb-6 space-y-3"
                />
                <MarkdownRenderer
                  value={landingContent?.aboutSubDescription || 'It ensures **traceability**, **accountability**, and **version control** for all controlled documents across departments.'}
                  className="text-lg sm:text-xl lg:text-2xl text-gray-700 leading-relaxed space-y-3"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Section */}
      <section id="features" className="scroll-mt-20 py-16 sm:py-20" style={{backgroundColor: 'var(--dms-landing-core-features-bg, #F9FAFB)'}}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">{t('hp_core_features')}</h2>
            <p className="text-gray-600 text-xl sm:text-2xl">{t('hp_core_features_desc')}</p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full mt-6"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {(landingContent?.features || []).slice(0, 4).map((feature, idx) => {
              const bgIsHex = isHexColor(feature.iconBgColor)
              const textIsHex = isHexColor(feature.textColor)
              const titleClass = textIsHex ? 'text-xl lg:text-2xl font-bold mb-3 leading-tight' : 'text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight'
              const titleStyle = textIsHex ? { color: feature.textColor } : undefined
              const descClass = textIsHex ? 'text-base lg:text-lg leading-relaxed space-y-2' : 'text-gray-600 text-base lg:text-lg leading-relaxed space-y-2'
              const descStyle = textIsHex ? { color: feature.textColor } : undefined

              return (
                <div key={idx} className="rounded-2xl p-6 lg:p-8 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border-2 border-gray-200 group bg-white">
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    {feature.iconImage && (
                      <div className="flex-shrink-0">
                        <div
                          className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 p-4 rounded-2xl ${bgIsHex ? '' : (feature.iconBgColor || 'bg-gray-200')} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow ring-1 ring-black/5`}
                          style={bgIsHex ? { backgroundColor: feature.iconBgColor } : undefined}
                        >
                          <img src={feature.iconImage} alt={feature.title} className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                      </div>
                    )}
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={titleClass} style={titleStyle}>
                        <MarkdownRenderer inline value={feature.title} />
                      </h3>
                      <MarkdownRenderer value={feature.description} className={descClass} style={descStyle} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* System Features Section */}
      <section className="py-16 sm:py-20" style={{background: 'var(--dms-landing-system-features-bg, linear-gradient(to bottom right, #EFF6FF, #FAF5FF))'}}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4">{t('hp_system_features')}</h2>
            <p className="text-gray-600 text-xl sm:text-2xl">{t('hp_system_features_desc')}</p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-purple-600 to-pink-600 mx-auto rounded-full mt-6"></div>
          </div>

          <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
            {(landingContent?.features || []).slice(4, 8).map((feature, idx) => {
              const bgIsHex = isHexColor(feature.iconBgColor)
              const textIsHex = isHexColor(feature.textColor)
              const titleClass = textIsHex ? 'text-xl lg:text-2xl font-bold mb-3 leading-tight' : 'text-xl lg:text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors leading-tight'
              const titleStyle = textIsHex ? { color: feature.textColor } : undefined
              const descClass = textIsHex ? 'text-base lg:text-lg leading-relaxed space-y-2' : 'text-gray-600 text-base lg:text-lg leading-relaxed space-y-2'
              const descStyle = textIsHex ? { color: feature.textColor } : undefined

              return (
                <div key={idx} className="rounded-2xl p-6 lg:p-8 hover:shadow-2xl hover:scale-[1.03] transition-all duration-300 border-2 border-gray-200 group bg-white">
                  <div className="flex items-start gap-5">
                    {/* Icon */}
                    {feature.iconImage && (
                      <div className="flex-shrink-0">
                        <div
                          className={`w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 p-4 rounded-2xl ${bgIsHex ? '' : (feature.iconBgColor || 'bg-gray-200')} flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow ring-1 ring-black/5`}
                          style={bgIsHex ? { backgroundColor: feature.iconBgColor } : undefined}
                        >
                          <img src={feature.iconImage} alt={feature.title} className="w-full h-full object-contain drop-shadow-sm" />
                        </div>
                      </div>
                    )}
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h3 className={titleClass} style={titleStyle}>
                        <MarkdownRenderer inline value={feature.title} />
                      </h3>
                      <MarkdownRenderer value={feature.description} className={descClass} style={descStyle} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Who Uses This System Section */}
      <section className="py-16 sm:py-20" style={{background: 'var(--dms-landing-roles-bg, linear-gradient(to bottom right, #ECFEFF, #EFF6FF, #FAF5FF))'}}>
        <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
              <MarkdownRenderer inline value={landingContent?.rolesTitle || t('hp_who_uses')} />
            </h2>
            <p className="text-gray-600 text-xl sm:text-2xl">{t('hp_who_uses_desc')}</p>
            <div className="w-24 h-1.5 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full mt-6"></div>
          </div>

          <div className="lg:hidden grid gap-4 sm:grid-cols-2">
            {[
              { title: roleCenter.name, desc: roleCenter.description, accent: 'from-cyan-500 to-blue-600' },
              { title: roleTop.name, desc: roleTop.description, accent: 'from-blue-500 to-blue-700' },
              { title: roleBottom.name, desc: roleBottom.description, accent: 'from-purple-500 to-purple-700' },
              { title: roleLeft.name, desc: roleLeft.description, accent: 'from-teal-500 to-teal-700' },
              { title: roleRight.name, desc: roleRight.description, accent: 'from-emerald-500 to-green-700' }
            ].map((r, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 shadow-md border border-white/60">
                <div className={`h-1.5 w-16 rounded-full bg-gradient-to-r ${r.accent} mb-3`} />
                <h3 className="text-lg font-bold text-gray-900">
                  <MarkdownRenderer inline value={r.title} />
                </h3>
                <MarkdownRenderer value={r.desc} className="mt-2 text-sm text-gray-600 leading-relaxed space-y-2" />
              </div>
            ))}
          </div>

          {/* Circular Diagram Layout */}
          <div className="relative max-w-6xl mx-auto hidden lg:block h-[clamp(440px,55vw,620px)]">
            {/* Admin - Center */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10">
              <div className="bg-gradient-to-br from-cyan-400 via-cyan-500 to-blue-500 rounded-3xl p-8 lg:p-10 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-110 w-[clamp(16rem,20vw,18rem)] text-center border-4 border-white">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-5 shadow-lg">
                  <svg className="w-12 h-12 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 drop-shadow">
                  <MarkdownRenderer inline value={roleCenter.name} />
                </h3>
                <MarkdownRenderer value={roleCenter.description} className="text-base text-white opacity-95 leading-relaxed space-y-2" />
              </div>
            </div>

            {/* Document Controller - Top Left */}
            <div className="absolute left-0 top-0">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 lg:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 w-[clamp(14rem,18vw,16rem)] text-white border-2 border-blue-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur">
                  <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  <MarkdownRenderer inline value={roleTop.name} />
                </h3>
                <MarkdownRenderer value={roleTop.description} className="text-sm leading-relaxed opacity-95 space-y-2" />
              </div>
            </div>

            {/* Document Owner - Top Right */}
            <div className="absolute right-0 top-0">
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 lg:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 w-[clamp(14rem,18vw,16rem)] text-white border-2 border-purple-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur">
                  <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  <MarkdownRenderer inline value={roleBottom.name} />
                </h3>
                <MarkdownRenderer value={roleBottom.description} className="text-sm leading-relaxed opacity-95 space-y-2" />
              </div>
            </div>

            {/* Reviewer - Bottom Left */}
            <div className="absolute left-0 bottom-0">
              <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl p-6 lg:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 w-[clamp(14rem,18vw,16rem)] text-white border-2 border-teal-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur">
                  <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  <MarkdownRenderer inline value={roleLeft.name} />
                </h3>
                <MarkdownRenderer value={roleLeft.description} className="text-sm leading-relaxed opacity-95 space-y-2" />
              </div>
            </div>

            {/* Approver - Bottom Right */}
            <div className="absolute right-0 bottom-0">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 lg:p-7 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 w-[clamp(14rem,18vw,16rem)] text-white border-2 border-green-300">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-white bg-opacity-20 rounded-full mb-4 backdrop-blur">
                  <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold mb-3">
                  <MarkdownRenderer inline value={roleRight.name} />
                </h3>
                <MarkdownRenderer value={roleRight.description} className="text-sm leading-relaxed opacity-95 space-y-2" />
              </div>
            </div>

            {/* Connecting Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <defs>
                <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{ stopColor: '#06b6d4', stopOpacity: 0.3 }} />
                  <stop offset="100%" style={{ stopColor: '#8b5cf6', stopOpacity: 0.3 }} />
                </linearGradient>
              </defs>
              {/* Lines from Admin center to each corner */}
              <line x1="50%" y1="50%" x2="26%" y2="20%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="50%" y1="50%" x2="74%" y2="20%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="50%" y1="50%" x2="26%" y2="80%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="50%" y1="50%" x2="74%" y2="80%" stroke="url(#lineGradient)" strokeWidth="2" strokeDasharray="5,5" />
            </svg>
          </div>
        </div>
      </section>

      {/* End-to-End Workflow Section */}
      <section id="workflow" className="scroll-mt-20 py-12 sm:py-16" style={{background: 'var(--dms-landing-workflow-bg, linear-gradient(to bottom right, #F8FAFC, #EFF6FF))'}}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
              <MarkdownRenderer inline value={landingContent?.workflowTitle || t('hp_workflow_title')} />
            </h2>
            <p className="text-gray-600 text-lg sm:text-xl">{t('hp_workflow_desc')}</p>
            <div className="w-20 h-1 bg-gradient-to-r from-blue-600 to-purple-600 mx-auto rounded-full mt-4"></div>
          </div>

          {/* Image Top Position */}
          {landingContent?.workflowImage && landingContent?.workflowImagePosition === 'top' && (
            <div className="flex justify-center mb-8">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-blue-100">
                <img src={landingContent.workflowImage} alt="Workflow" className="h-48 w-auto object-contain mx-auto" />
              </div>
            </div>
          )}

          <div className={`${landingContent?.workflowImage && (landingContent?.workflowImagePosition === 'left' || landingContent?.workflowImagePosition === 'right') ? 'grid lg:grid-cols-2 gap-8 xl:gap-12 items-center' : ''}`}>
            {/* Image Left Position */}
            {landingContent?.workflowImage && landingContent?.workflowImagePosition === 'left' && (
              <div className="flex justify-center order-2 lg:order-1">
                <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-blue-100 inline-flex">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-200/35 via-cyan-200/25 to-purple-200/35 blur-xl"></div>
                  <img src={landingContent.workflowImage} alt="Workflow" className="relative h-56 sm:h-64 w-auto object-contain mx-auto" />
                </div>
              </div>
            )}

            {/* Workflow Steps - Enhanced Modern Design */}
            <div className={`relative ${landingContent?.workflowImage && landingContent?.workflowImagePosition === 'left' ? 'order-1 md:order-2' : ''}`}>
              <div className="rounded-2xl bg-white/70 backdrop-blur border border-white/70 shadow-sm p-4 sm:p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-3xl mx-auto">
                  {workflowSteps.map((stepObj, idx) => {
                    const stepText = typeof stepObj?.step === 'string' ? stepObj.step : ''
                    const style = workflowStyleFor(stepObj?.color, idx)
                    const colSpan = idx === workflowSteps.length - 1 && workflowSteps.length % 3 === 1 ? 'lg:col-span-3' : ''

                    return (
                      <div key={idx} className={`${colSpan} relative group`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${style.from} ${style.to} rounded-2xl blur opacity-60 group-hover:opacity-100 transition`}></div>
                        <div className={`relative bg-white rounded-2xl p-5 shadow-md border ${style.border} hover:-translate-y-0.5 hover:shadow-lg transition-all`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 bg-gradient-to-br ${style.badgeFrom} ${style.badgeTo} rounded-full flex items-center justify-center text-white font-bold shadow-md text-sm`}>
                              {idx + 1}
                            </div>
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                              <MarkdownRenderer inline value={stepText} />
                            </h4>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Image Right Position */}
            {landingContent?.workflowImage && landingContent?.workflowImagePosition === 'right' && (
              <div className="flex justify-center order-2">
                <div className="relative bg-white p-6 rounded-2xl shadow-xl border border-blue-100 inline-flex">
                  <div className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-blue-200/35 via-cyan-200/25 to-purple-200/35 blur-xl"></div>
                  <img src={landingContent.workflowImage} alt="Workflow" className="relative h-56 sm:h-64 w-auto object-contain mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Image Bottom Position */}
          {landingContent?.workflowImage && landingContent?.workflowImagePosition === 'bottom' && (
            <div className="flex justify-center mt-8">
              <div className="bg-white p-6 rounded-2xl shadow-xl border-2 border-blue-100">
                <img src={landingContent.workflowImage} alt="Workflow" className="h-48 w-auto object-contain mx-auto" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="scroll-mt-20 py-16 sm:py-20" style={{backgroundColor: 'var(--dms-landing-contact-bg, #F3F4F6)'}}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 w-full">
          {/* Image Top Position */}
          {landingContent?.contactImage && landingContent?.contactImagePosition === 'top' && (
            <div className="flex justify-center mb-12">
              <div className="bg-white p-8 rounded-2xl shadow-xl">
                <img src={landingContent.contactImage} alt="Contact" className="h-56 w-auto object-contain mx-auto" />
              </div>
            </div>
          )}

          <div className={`${landingContent?.contactImage && (landingContent?.contactImagePosition === 'left' || landingContent?.contactImagePosition === 'right') ? 'grid md:grid-cols-2 gap-12 items-center' : ''}`}>
            {/* Image Left Position */}
            {landingContent?.contactImage && landingContent?.contactImagePosition === 'left' && (
              <div className="flex justify-center order-2 md:order-1">
                <div className="bg-white p-8 rounded-2xl shadow-xl">
                  <img src={landingContent.contactImage} alt="Contact" className="h-64 w-auto object-contain mx-auto" />
                </div>
              </div>
            )}

            {/* Contact Info */}
            <div className={`text-center ${landingContent?.contactImage && landingContent?.contactImagePosition === 'left' ? 'order-1 md:order-2' : ''}`}>
              <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 sm:mb-8">
                <MarkdownRenderer inline value={landingContent?.contactTitle || t('hp_need_assistance')} />
              </h2>
              <MarkdownRenderer
                value={landingContent?.contactDescription || t('hp_contact_desc')}
                className="text-xl sm:text-2xl text-gray-700 mb-8 sm:mb-10 leading-relaxed space-y-3"
              />

              <div className="space-y-5 sm:space-y-6 max-w-3xl mx-auto">
                {/* Email */}
                <div className="flex items-start sm:items-center justify-center bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                  <EnvelopeIcon className="h-7 w-7 sm:h-8 sm:w-8 text-purple-600 mr-3 sm:mr-4 flex-shrink-0 mt-1 sm:mt-0" />
                  <div className="flex flex-col sm:flex-row sm:items-center flex-wrap justify-center gap-1 sm:gap-0 min-w-0">
                    {effectiveContactEmails.map((email, idx) => (
                      <React.Fragment key={email + idx}>
                        {idx > 0 && <span className="text-gray-600 hidden sm:inline text-lg mx-2"> / </span>}
                        <a href={`mailto:${email}`} className="text-sm sm:text-base lg:text-lg text-blue-600 hover:underline font-medium break-all">
                          {email}
                        </a>
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center justify-center bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-shadow">
                  <PhoneIcon className="h-7 w-7 sm:h-8 sm:w-8 text-pink-600 mr-3 sm:mr-4 flex-shrink-0" />
                  <a href={contactPhoneHref} className="text-base sm:text-lg text-gray-900 font-semibold">
                    {contactPhoneText}
                  </a>
                </div>
              </div>
            </div>

            {/* Image Right Position */}
            {landingContent?.contactImage && landingContent?.contactImagePosition === 'right' && (
              <div className="flex justify-center order-2">
                <div className="bg-white p-6 rounded-xl shadow-lg">
                  <img src={landingContent.contactImage} alt="Contact" className="h-56 w-auto object-contain mx-auto" />
                </div>
              </div>
            )}
          </div>

          {/* Image Bottom Position */}
          {landingContent?.contactImage && landingContent?.contactImagePosition === 'bottom' && (
            <div className="flex justify-center mt-8">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <img src={landingContent.contactImage} alt="Contact" className="h-48 w-auto object-contain mx-auto" />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-600 text-xs sm:text-sm mb-2">
              <MarkdownRenderer inline value={landingContent?.copyrightText || '© 2025 CLB Groups. All rights reserved.'} />
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-4 text-xs sm:text-sm">
              {(landingContent?.footerLinks || []).map((link, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-gray-400 hidden sm:inline">|</span>}
                  <button
                    type="button"
                    onClick={() => handlePdfLinkClick(link)}
                    className="text-gray-600 hover:text-blue-600 cursor-pointer transition-colors"
                    disabled={!link.pdf}
                  >
                    <MarkdownRenderer inline value={link.label} />
                  </button>
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </footer>

      </main>

      {/* PDF Viewer Modal */}
      {pdfModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) closePdfModal(); }}>
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200" role="dialog" aria-modal="true" aria-labelledby="landing-pdf-title">
              <h3 id="landing-pdf-title" className="text-xl font-bold text-gray-900">{pdfModal.title}</h3>
              <button
                type="button"
                onClick={closePdfModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                aria-label="Close PDF viewer"
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            {/* PDF Content */}
            <div className="flex-1 overflow-auto p-4">
              <iframe
                src={pdfModal.pdfData}
                className="w-full h-full border-0 rounded"
                title={pdfModal.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;
