import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function GettingStartedModal({ open, onClose, showAdminGuide }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('user')

  const userSteps = useMemo(() => ([
    {
      title: 'Lengkapkan profil & preferences',
      body: 'Pergi ke Profile Settings untuk kemas kini nama, jabatan, nombor telefon, dan tetapan notifikasi.',
      actionLabel: 'Buka Profile',
      to: '/profile'
    },
    {
      title: 'Buat permohonan dokumen (NDR)',
      body: 'Pergi ke New Document Request, isi maklumat dokumen, dan hantar untuk acknowledgment. Anda tidak boleh acknowledge permohonan anda sendiri.',
      actionLabel: 'Buka NDR',
      to: '/new-document-request'
    },
    {
      title: 'Muat turun template selepas acknowledged',
      body: 'Selepas permohonan di-acknowledge, klik Document Type pada senarai permohonan untuk muat turun template yang berkaitan.',
      actionLabel: 'Buka NDR',
      to: '/new-document-request'
    },
    {
      title: 'Sediakan draf & hantar untuk review',
      body: 'Gunakan template untuk drafting, kemudian upload draf ke Draft Documents dan submit untuk review.',
      actionLabel: 'Buka Drafts',
      to: '/drafts'
    },
    {
      title: 'Review → Approval → Publish',
      body: 'PIC (reviewer/approver) akan buat semakan & kelulusan. Document Controller akan publish dokumen selepas approval lengkap.',
      actionLabel: 'Buka Review',
      to: '/review-approval'
    },
    {
      title: 'Superseded / Obsolete',
      body: 'Dokumen yang melebihi tempoh retention atau digantikan oleh versi/rekod baharu akan dikategorikan sebagai Superseded atau Obsolete berdasarkan polisi sistem.',
      actionLabel: 'Buka Superseded',
      to: '/archived'
    }
  ]), [])

  const adminSteps = useMemo(() => ([
    {
      title: 'Konfigurasi sistem (General System)',
      body: 'Pergi ke Configuration → General System dan lengkapkan semua sub-module dan settings (Company Info, Landing Page, Theme & Branding, Document Settings, Notification Settings, Security).',
      actionLabel: 'Buka Configuration',
      to: '/config'
    },
    {
      title: 'Master data (ikut urutan)',
      body: 'Pergi ke Configuration → Master Data dan kemas kini data mengikut urutan: Departments → Project Categories → Document Types.',
      actionLabel: 'Buka Master Data',
      to: '/config'
    },
    {
      title: 'Template management',
      body: 'Pergi ke Configuration → Template Management dan upload template yang berkaitan untuk setiap Document Type (ikut keperluan operasi).',
      actionLabel: 'Buka Templates',
      to: '/config'
    },
    {
      title: 'Role & Permission + Users',
      body: 'Pergi ke Configuration → Role & Permission untuk setup Roles Management dan add Users. Pastikan permission & module access betul sebelum go-live.',
      actionLabel: 'Buka Roles',
      to: '/config'
    },
    {
      title: 'Semak workflow dokumen',
      body: 'Pastikan aliran kerja (review/approval/acknowledgment) dan assignment roles selari dengan SOP organisasi.',
      actionLabel: 'Buka Configuration',
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
            <h3 className="text-lg font-semibold text-gray-900">Getting Started</h3>
            <p className="text-sm text-gray-600 mt-1">Panduan ringkas untuk mula guna sistem dengan lancar.</p>
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
              User Guide
            </button>
            {showAdminGuide && (
              <button
                type="button"
                onClick={() => setActiveTab('admin')}
                className={`px-4 py-2 text-sm font-medium border-b-2 ${
                  activeTab === 'admin' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Admin Guide
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 max-h-[65vh] overflow-auto">
          <ol className="space-y-3">
            {steps.map((s, idx) => (
              <li key={s.title} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {idx + 1}. {s.title}
                    </div>
                    <div className="text-sm text-gray-700 mt-1">{s.body}</div>
                  </div>
                  {s.to && (
                    <button
                      type="button"
                      onClick={() => {
                        navigate(s.to)
                        onClose?.()
                      }}
                      className="shrink-0 px-3 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      {s.actionLabel || 'Open'}
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
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

