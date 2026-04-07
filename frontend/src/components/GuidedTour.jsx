import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { usePreferences } from '../contexts/PreferencesContext'

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n))
}

function getTargetRect(targetId) {
  const el = document.querySelector(`[data-tour-id="${targetId}"]`)
  if (!el) return null
  const rect = el.getBoundingClientRect()
  return { el, rect }
}

function computeTooltipPosition(rect, placement) {
  const padding = 12
  const w = 360
  const h = 160
  const vw = window.innerWidth
  const vh = window.innerHeight

  if (!rect) {
    return { left: clamp((vw - w) / 2, padding, vw - w - padding), top: clamp((vh - h) / 2, padding, vh - h - padding) }
  }

  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2

  let left = cx - w / 2
  let top = 0

  if (placement === 'top') top = rect.top - h - 12
  else if (placement === 'left') { left = rect.left - w - 12; top = cy - h / 2 }
  else if (placement === 'right') { left = rect.right + 12; top = cy - h / 2 }
  else top = rect.bottom + 12

  return {
    left: clamp(left, padding, vw - w - padding),
    top: clamp(top, padding, vh - h - padding)
  }
}

export default function GuidedTour({ open, tourId, onClose }) {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const location = useLocation()
  const [stepIndex, setStepIndex] = useState(0)
  const [targetRect, setTargetRect] = useState(null)
  const rafRef = useRef(null)
  const timeoutRef = useRef(null)

  const steps = useMemo(() => {
    if (tourId === 'admin') {
      return [
        { target: 'nav-config', titleKey: 'tour_admin_1_title', bodyKey: 'tour_admin_1_body', placement: 'right' },
        { route: '/config', target: 'config-tab-general', titleKey: 'tour_admin_2_title', bodyKey: 'tour_admin_2_body', placement: 'bottom' },
        { route: '/config', target: 'config-tab-masterdata', titleKey: 'tour_admin_3_title', bodyKey: 'tour_admin_3_body', placement: 'bottom' },
        { route: '/config', target: 'config-tab-template', titleKey: 'tour_admin_4_title', bodyKey: 'tour_admin_4_body', placement: 'bottom' },
        { route: '/config', target: 'tmpl-btn-add-template', titleKey: 'tour_admin_5_title', bodyKey: 'tour_admin_5_body', placement: 'left' },
        { route: '/config', target: 'config-tab-roles', titleKey: 'tour_admin_6_title', bodyKey: 'tour_admin_6_body', placement: 'bottom' }
      ]
    }

    return [
      { target: 'nav-profile', titleKey: 'tour_user_1_title', bodyKey: 'tour_user_1_body', placement: 'right' },
      { route: '/profile', target: 'profile-page', titleKey: 'tour_user_2_title', bodyKey: 'tour_user_2_body', placement: 'bottom' },
      { target: 'nav-new-document-request', titleKey: 'tour_user_3_title', bodyKey: 'tour_user_3_body', placement: 'right' },
      { route: '/new-document-request', target: 'ndr-page', titleKey: 'tour_user_4_title', bodyKey: 'tour_user_4_body', placement: 'bottom' },
      { route: '/new-document-request', target: 'ndr-field-document-type', titleKey: 'tour_user_4a_title', bodyKey: 'tour_user_4a_body', placement: 'bottom' },
      { route: '/new-document-request', target: 'ndr-btn-submit', titleKey: 'tour_user_4b_title', bodyKey: 'tour_user_4b_body', placement: 'top' },
      { target: 'nav-drafts', titleKey: 'tour_user_5_title', bodyKey: 'tour_user_5_body', placement: 'right' },
      { route: '/drafts', target: 'drafts-btn-new-draft', titleKey: 'tour_user_5a_title', bodyKey: 'tour_user_5a_body', placement: 'left' },
      { target: 'nav-review-approval', titleKey: 'tour_user_6_title', bodyKey: 'tour_user_6_body', placement: 'right' }
    ]
  }, [tourId])

  useEffect(() => {
    if (!open) return
    setStepIndex(0)
  }, [open, tourId])

  useEffect(() => {
    if (!open) return
    const step = steps[stepIndex]
    if (!step) return
    if (step.route && location.pathname !== step.route) {
      navigate(step.route)
    }
  }, [open, stepIndex, steps, location.pathname, navigate])

  useEffect(() => {
    if (!open) return
    const step = steps[stepIndex]
    if (!step) return

    const clear = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      rafRef.current = null
      timeoutRef.current = null
    }

    clear()
    setTargetRect(null)

    const start = Date.now()
    const tick = () => {
      const found = getTargetRect(step.target)
      if (found) {
        try {
          found.el.scrollIntoView({ block: 'center', behavior: 'smooth' })
        } catch {
        }
        setTargetRect(found.rect)
        return
      }
      if (Date.now() - start > 2500) return
      rafRef.current = requestAnimationFrame(tick)
    }

    timeoutRef.current = setTimeout(() => tick(), 0)
    return clear
  }, [open, stepIndex, steps, location.pathname])

  useEffect(() => {
    if (!open) return
    const onResize = () => {
      const step = steps[stepIndex]
      if (!step) return
      const found = getTargetRect(step.target)
      setTargetRect(found?.rect || null)
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [open, stepIndex, steps])

  if (!open) return null

  const step = steps[stepIndex]
  const isLast = stepIndex === steps.length - 1
  const tooltipPos = computeTooltipPosition(targetRect, step?.placement || 'bottom')

  const pad = 8
  const highlight = targetRect
    ? {
        left: Math.max(0, targetRect.left - pad),
        top: Math.max(0, targetRect.top - pad),
        width: Math.min(window.innerWidth, targetRect.width + pad * 2),
        height: Math.min(window.innerHeight, targetRect.height + pad * 2)
      }
    : null

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" />
      {highlight && (
        <div
          className="fixed rounded-lg"
          style={{
            left: highlight.left,
            top: highlight.top,
            width: highlight.width,
            height: highlight.height,
            boxShadow: '0 0 0 9999px rgba(0,0,0,0.55)',
            border: '2px solid rgba(253, 224, 71, 0.9)',
            pointerEvents: 'none'
          }}
        />
      )}

      <div
        className="fixed bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-[360px]"
        style={{ left: tooltipPos.left, top: tooltipPos.top }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-gray-900">{t(step.titleKey)}</div>
            <div className="text-sm text-gray-700 mt-1">{t(step.bodyKey)}</div>
            <div className="text-xs text-gray-500 mt-2">
              {t('tour_step_indicator')} {stepIndex + 1}/{steps.length}
            </div>
          </div>
          <button
            type="button"
            onClick={() => onClose?.({ completed: false })}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mt-4">
          <button
            type="button"
            onClick={() => onClose?.({ completed: false })}
            className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('tour_skip')}
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStepIndex((i) => Math.max(0, i - 1))}
              disabled={stepIndex === 0}
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:hover:bg-transparent"
            >
              {t('tour_back')}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isLast) onClose?.({ completed: true })
                else setStepIndex((i) => Math.min(steps.length - 1, i + 1))
              }}
              className="px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              {isLast ? t('tour_done') : t('tour_next')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
