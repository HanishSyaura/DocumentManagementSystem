import React, { useState, useEffect } from 'react'
import mammoth from 'mammoth'
import * as XLSX from 'xlsx'

export default function TemplatePreviewModal({ template, onClose }) {
  const [loading, setLoading] = useState(true)
  const [content, setContent] = useState(null)
  const [contentType, setContentType] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadPreview = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        const baseURL = import.meta.env.VITE_API_URL || '/api'
        
        // Fetch the file
        const response = await fetch(`${baseURL}/templates/${template.id}/preview`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (!response.ok) {
          throw new Error('Failed to load template')
        }

        const fileExtension = template.fileName.toLowerCase().split('.').pop()
        
        if (fileExtension === 'docx' || fileExtension === 'dotx') {
          // Handle Word documents
          const arrayBuffer = await response.arrayBuffer()
          const result = await mammoth.convertToHtml({ arrayBuffer })
          setContent(result.value)
          setContentType('html')
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls' || fileExtension === 'csv') {
          // Handle Excel/CSV files
          const arrayBuffer = await response.arrayBuffer()
          const workbook = XLSX.read(arrayBuffer, { type: 'array' })
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
          const htmlContent = XLSX.utils.sheet_to_html(firstSheet, { editable: false })
          setContent(htmlContent)
          setContentType('html')
        } else {
          throw new Error('Unsupported file format for preview')
        }
      } catch (err) {
        console.error('Failed to load template preview:', err)
        setError(err.message || 'Failed to load template preview')
      } finally {
        setLoading(false)
      }
    }

    if (template) {
      loadPreview()
    }
  }, [template])

  const handleDownload = async () => {
    try {
      const token = localStorage.getItem('token')
      const baseURL = import.meta.env.VITE_API_URL || '/api'
      
      const response = await fetch(`${baseURL}/templates/${template.id}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to download template')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = template.fileName || template.templateName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Failed to download template:', err)
      alert('Failed to download template')
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-semibold text-gray-900 truncate">
              Template Preview: {template.templateName}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {template.documentType} • Version {template.version} • {template.fileName}
            </p>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={handleDownload}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              title="Download template"
            >
              <svg className="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
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

        {/* Preview Content */}
        <div className="flex-1 overflow-hidden bg-gray-100">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <p className="text-gray-600">Loading template preview...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <svg className="w-16 h-16 text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          ) : content && contentType === 'html' ? (
            <div className="h-full overflow-auto p-6 bg-white">
              <div 
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
                style={{
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontSize: '12pt',
                  lineHeight: '1.6'
                }}
              />
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-500">
              This is a read-only preview. Download the file to edit.
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
