import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePreferences } from '../contexts/PreferencesContext'

export default function GettingStartedModal({ open, onClose, showAdminGuide }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('user')
  const { t } = usePreferences()

  const userSteps = useMemo(() => ([
    {
      titleKey: 'gs_user_1_title',
      bodyKey: 'gs_user_1_body',
      actionLabelKey: 'gs_open_profile',
      to: '/profile'
    },
    {
      titleKey: 'gs_user_2_title',
      bodyKey: 'gs_user_2_body',
      actionLabelKey: 'gs_open_ndr',
      to: '/new-document-request'
    },
    {
      titleKey: 'gs_user_3_title',
      bodyKey: 'gs_user_3_body',
      actionLabelKey: 'gs_open_ndr',
      to: '/new-document-request'
    },
    {
      titleKey: 'gs_user_4_title',
      bodyKey: 'gs_user_4_body',
      actionLabelKey: 'gs_open_drafts',
      to: '/drafts'
    },
    {
      titleKey: 'gs_user_5_title',
      bodyKey: 'gs_user_5_body',
      actionLabelKey: 'gs_open_review',
      to: '/review-approval'
    },
    {
      titleKey: 'gs_user_6_title',
      bodyKey: 'gs_user_6_body',
      actionLabelKey: 'gs_open_superseded',
      to: '/archived'
    }
  ]), [])

  const adminSteps = useMemo(() => ([
    {
      titleKey: 'gs_admin_1_title',
      bodyKey: 'gs_admin_1_body',
      actionLabelKey: 'gs_open_config',
      to: '/config'
    },
    {
      titleKey: 'gs_admin_2_title',
      bodyKey: 'gs_admin_2_body',
      actionLabelKey: 'gs_open_config',
      to: '/config'
    },
    {
      titleKey: 'gs_admin_3_title',
      bodyKey: 'gs_admin_3_body',
      actionLabelKey: 'gs_open_config',
      to: '/config'
    },
    {
      titleKey: 'gs_admin_4_title',
      bodyKey: 'gs_admin_4_body',
      actionLabelKey: 'gs_open_config',
      to: '/config'
    },
    {
      titleKey: 'gs_admin_5_title',
      bodyKey: 'gs_admin_5_body',
      actionLabelKey: 'gs_open_config',
      to: '/config'
    }
  ]), [])

  if (!open) return null

  const steps = activeTab === 'admin' ? adminSteps : userSteps

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{t('getting_started')}</h3>
            <p className="text-sm text-gray-600 mt-1">{t('gs_subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={() => onClose?.()}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="flex gap-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setActiveTab('user')}
              className={`px-4 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'user' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {t('gs_user_tab')}
            </button>
            {showAdminGuide && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {t('gs_admin_tab')}
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 max-h-[65vh] overflow-auto">
          <ol className="space-y-3">
            {steps.map((s, idx) => (
              <li key={s.titleKey} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {idx + 1}. {t(s.titleKey)}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{t(s.bodyKey)}</div>
                    <div className="text-xs text-gray-500 mt-2">{t('gs_where_to_click')}</div>
                  </div>
                  {s.to && (
                    <button
                      type="button"
                      onClick={() => {
                        try {
                          localStorage.setItem('dms_guide_target_path', s.to)
                        } catch {
                        }
                        navigate(s.to)
                        onClose?.()
                      }}
                      className="shrink-0 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {t(s.actionLabelKey) || t('open')}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onClose?.()}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  )
}
