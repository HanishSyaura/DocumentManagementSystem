import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MarkdownRenderer from './MarkdownRenderer'

export default function PublicFooter({ copyrightText, footerLinks, onPdfLinkClick }) {
  const navigate = useNavigate()

  const [stored, setStored] = useState(() => {
    try {
      const saved = localStorage.getItem('dms_landing_page_settings')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    const load = () => {
      try {
        const saved = localStorage.getItem('dms_landing_page_settings')
        setStored(saved ? JSON.parse(saved) : null)
      } catch {
        setStored(null)
      }
    }

    window.addEventListener('storage', load)
    return () => window.removeEventListener('storage', load)
  }, [])

  const resolvedCopyright = copyrightText ?? stored?.copyrightText ?? '© 2025 CLB Groups. All rights reserved.'
  const resolvedLinks = useMemo(() => {
    const list = footerLinks ?? stored?.footerLinks ?? []
    return Array.isArray(list) ? list : []
  }, [footerLinks, stored])

  const onLinkClick = (link) => {
    if (typeof onPdfLinkClick === 'function') {
      onPdfLinkClick(link)
      return
    }
    if (link?.pdf) {
      window.open(link.pdf, '_blank', 'noopener,noreferrer')
      return
    }
    if (typeof link?.href === 'string' && link.href) {
      window.open(link.href, '_blank', 'noopener,noreferrer')
      return
    }
  }

  return (
    <footer className="fixed bottom-0 inset-x-0 z-40 bg-white/80 backdrop-blur border-t border-gray-200">
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-12">
          <p className="text-gray-600 text-xs leading-tight truncate">
            <MarkdownRenderer inline value={resolvedCopyright} />
          </p>

          <div className="flex items-center gap-3">
            {resolvedLinks.slice(0, 2).map((link, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onLinkClick(link)}
                className="hidden sm:inline text-xs text-gray-600 hover:text-blue-600 transition-colors"
                disabled={!link?.pdf && !link?.href}
              >
                <MarkdownRenderer inline value={link?.label || ''} />
              </button>
            ))}

            <button
              type="button"
              onClick={() => navigate('/#contact')}
              className="text-xs font-semibold text-blue-700 hover:text-blue-900 transition-colors"
            >
              Contact
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

