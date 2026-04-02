import React, { useState, useEffect } from 'react'
import api from '../api/axios'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'
import { usePreferences } from '../contexts/PreferencesContext'

export default function DocumentViewerModal({ document, onClose }) {
  const { t } = usePreferences()
  const [loading, setLoading] = useState(true)
  const [fileUrl, setFileUrl] = useState(null)
  const [htmlContent, setHtmlContent] = useState(null)
  const [contentType, setContentType] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadDocument = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const res = await api.get(`/documents/${document.id}/download`, {
          responseType: 'blob'
        })
        
        // Get file extension from response headers or document title
        const mimeType = res.headers['content-type'] || ''
        const fileName = document.title || ''
        const fileExtension = fileName.toLowerCase().split('.').pop()
        
        // Handle Word documents (.docx, .doc)
        if (mimeType.includes('word') || fileExtension === 'docx' || fileExtension === 'doc') {
          const arrayBuffer = await res.data.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setHtmlContent(result.value)
          setContentType('html')
        }
        // Handle Excel files (.xlsx, .xls, .csv)
        else if (mimeType.includes('spreadsheet') || fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
          const arrayBuffer = await res.data.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const htmlTable = XLSX.utils.sheet_to_html(firstSheet, { editable: false })
          setHtmlContent(htmlTable)
          setContentType('html')
        }
        // Handle PDF and other files
        else if (mimeType.includes('pdf') || fileExtension === 'pdf') {
          const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
          setFileUrl(url)
          setContentType('pdf')
        }
        // Handle images
        else if (mimeType.includes('image') || ['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(fileExtension)) {
          const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }))
          setFileUrl(url)
          setContentType('image')
        }
        // Fallback for other file types
        else {
          const url = window.URL.createObjectURL(new Blob([res.data], { type: mimeType }))
          setFileUrl(url)
          setContentType('other')
        }
      } catch (err) {
        console.error('Failed to load document:', err)
        setError(err.response?.data?.message || err.message || 'Failed to load document')
      } finally {
        setLoading(false)
      }
    }

    if (document) {
      loadDocument()
    }

    // Cleanup
    return () => {
      if (fileUrl) {
        window.URL.revokeObjectURL(fileUrl)
      }
    }
  }, [document])

  const handleDownload = async () => {
    try {
      const res = await api.get(`/documents/${document.id}/download`, {
        responseType: 'blob'
      })
      
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', document.title || `document-${document.id}`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download document:', err)
      alert('Failed to download document')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-[95vw] max-w-[1400px] h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              {t('document_preview')}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {document.fileCode} • {document.title} • {t('version')} {document.version}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              title={t('download')}
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {t('download')}
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Document Viewer Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">{t('loading_document')}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 mb-4">{error === 'Failed to load document' ? t('failed_load_doc') : error}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors mb-2"
              >
                {t('download')}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                {t('close')}
              </button>
            </div>
          ) : contentType === 'html' && htmlContent ? (
            <div className="h-full overflow-auto p-8 bg-white">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
                style={{
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontSize: '11pt',
                  lineHeight: '1.6'
                }}
              />
            </div>
          ) : contentType === 'pdf' && fileUrl ? (
            <iframe
              src={fileUrl}
              className="w-full h-full border-0"
              title="Document Preview"
            />
          ) : contentType === 'image' && fileUrl ? (
            <div className="h-full overflow-auto p-8 bg-gray-100 flex items-center justify-center">
              <img src={fileUrl} alt="Document" className="max-w-full max-h-full object-contain" />
            </div>
          ) : fileUrl ? (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-600 mb-4">{t('preview_not_available')}</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('download_to_view')}
              </button>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {t('readonly_preview_notice')}
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              {t('close')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
