import React, { useState } from 'react'
import api from '../api/axios'
import DocumentViewerModal from './DocumentViewerModal'
import ConfirmModal, { AlertModal } from './ConfirmModal'

export default function ReviewSupersedeModal({ document, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    reviewComments: ''
  })
  const [showViewModal, setShowViewModal] = useState(false)
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' })
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleProceed = async () => {
    // Comments are optional for proceeding
    try {
      await api.post(`/supersede-requests/${document.id}/review`, {
        action: 'approve',
        comments: formData.reviewComments || ''
      })
      
      setAlertModal({ show: true, title: 'Success', message: 'Request approved and forwarded for final approval!', type: 'success' })
      setTimeout(() => onSubmit({ action: 'proceed' }), 1500)
    } catch (error) {
      console.error('Failed to review request:', error)
      setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to submit review', type: 'error' })
    }
  }

  const handleReject = async () => {
    if (!formData.reviewComments) {
      setAlertModal({ show: true, title: 'Validation Error', message: 'Please provide review comments for rejection', type: 'warning' })
      return
    }

    setConfirmModal({
      show: true,
      title: 'Confirm Rejection',
      message: 'Are you sure you want to reject this request?',
      onConfirm: async () => {
        setConfirmModal({ show: false })
        try {
          await api.post(`/supersede-requests/${document.id}/review`, {
            action: 'reject',
            comments: formData.reviewComments
          })
          
          setAlertModal({ show: true, title: 'Success', message: 'Request rejected successfully!', type: 'success' })
          setTimeout(() => onSubmit({ action: 'reject' }), 1500)
        } catch (error) {
          console.error('Failed to reject request:', error)
          setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to reject request', type: 'error' })
        }
      }
    })
  }

  const handleViewDocument = () => {
    if (!document?.documentId) {
      setAlertModal({ show: true, title: 'Error', message: 'Document ID not found', type: 'error' })
      return
    }
    setShowViewModal(true)
  }


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <ConfirmModal
        show={confirmModal.show}
        title={confirmModal.title}
        message={confirmModal.message}
        type="danger"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ show: false })}
      />
      <AlertModal
        show={alertModal.show}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal({ show: false })}
      />
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-gray-900">Review Supersede / Obsolete Document</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Please make sure a replacement file is available before requesting to supersede, and ensure it goes through the review and approval process.
          </p>
        </div>

        {/* Form Content */}
        <div className="px-6 py-4 space-y-4">
          {/* File Code and Document Action Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                File Code
              </label>
              <input
                type="text"
                value={document?.fileCode || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Action Type
              </label>
              <input
                type="text"
                value={document?.actionType || 'Supersede / Obsolete'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Document Title and Version */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Title
              </label>
              <input
                type="text"
                value={document?.title || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Version / Revision No.
              </label>
              <input
                type="text"
                value={document?.version || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Document Type and Requested By */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Type
              </label>
              <input
                type="text"
                value={document?.documentType || 'N/A'}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Requested By
              </label>
              <input
                type="text"
                value={document?.submittedBy || document?.requestedBy || ''}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
              />
            </div>
          </div>

          {/* Reason for Supersede / Obsolete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Supersede / Obsolete
            </label>
            <textarea
              value={document?.reason || 'Exercitation id et irure labore dolore nostrud ad.'}
              disabled
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none resize-none"
            />
          </div>

          {/* Replacement File Code (if Supersede) */}
          {document?.actionType === 'Supersede' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Replacement File Code (if Supersede)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={document?.replacementFileCode || ''}
                  disabled
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 outline-none"
                />
                <button className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 my-6"></div>

          {/* Review Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Review Comments <span className="text-xs text-gray-500 font-normal">(Optional for proceed, required for reject)</span>
            </label>
            <textarea
              name="reviewComments"
              value={formData.reviewComments}
              onChange={handleInputChange}
              placeholder="Enter your review comments (optional for proceed, required for reject)"
              rows="4"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-wrap justify-between gap-3 sticky bottom-0">
          <button
            onClick={handleViewDocument}
            className="px-5 py-2 text-sm font-medium text-white bg-gray-500 rounded-lg hover:bg-gray-600 transition-colors"
          >
            View Document
          </button>
          <div className="flex gap-3">
            <button
              onClick={handleReject}
              className="px-5 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleProceed}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>

      {/* Document Viewer Modal */}
      {showViewModal && document && (
        <DocumentViewerModal
          document={{ ...document, id: document.documentId }}
          onClose={() => setShowViewModal(false)}
        />
      )}
    </div>
  )
}
