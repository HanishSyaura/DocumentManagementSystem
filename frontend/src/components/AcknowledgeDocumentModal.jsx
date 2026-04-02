import React, { useState } from 'react'
import { usePreferences } from '../contexts/PreferencesContext'

export default function AcknowledgeDocumentModal({ document, onClose, onSubmit }) {
  const { t } = usePreferences()
  const [formData, setFormData] = useState({
    fileCode: document?.fileCode || '',
    documentTitle: document?.title || '',
    versionNo: document?.version || '',
    documentType: '',
    comments: '',
    acknowledgementDate: new Date().toISOString().split('T')[0] // Current date
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }


  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-bold text-gray-900">{t('acknowledged_document')}</h2>
            <p className="text-sm text-gray-600 mt-1">
              {t('modal_draft_desc')}
            </p>
          </div>

          {/* Modal Body */}
          <div className="px-6 py-4 space-y-4">
            {/* File Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('file_code')}
              </label>
              <input
                type="text"
                name="fileCode"
                value={formData.fileCode}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                readOnly
              />
            </div>

            {/* Document Title & Version */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('document_title_col')}
                </label>
                <input
                  type="text"
                  name="documentTitle"
                  value={formData.documentTitle}
                  onChange={handleInputChange}
                  placeholder="Input text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('version_revision')}
                </label>
                <input
                  type="text"
                  name="versionNo"
                  value={formData.versionNo}
                  onChange={handleInputChange}
                  placeholder="Input text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                />
              </div>
            </div>

            {/* Document Type & Comments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('doc_type')}
                </label>
                <input
                  type="text"
                  name="documentType"
                  value={formData.documentType}
                  onChange={handleInputChange}
                  placeholder="Input text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('comments_notes')}
                </label>
                <textarea
                  name="comments"
                  value={formData.comments}
                  onChange={handleInputChange}
                  placeholder="Input text"
                  rows="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>
            </div>

            {/* Acknowledgement Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('acknowledgement_date')}
              </label>
              <div className="relative">
                <input
                  type="date"
                  name="acknowledgementDate"
                  value={formData.acknowledgementDate}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {t('acknowledged_btn')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
