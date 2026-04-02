import React, { useMemo, useRef, useState } from 'react'
import useFileUploadSettings from '../hooks/useFileUploadSettings'

export default function BulkImportModal({ isOpen, onClose, onSubmit, folders, selectedFolderId }) {
  const [folderId, setFolderId] = useState(selectedFolderId || '')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [files, setFiles] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const { validateFile, getAcceptString, getAllowedTypesDisplay } = useFileUploadSettings()

  const isSingle = files.length === 1
  const derivedSingleTitle = useMemo(() => {
    if (!isSingle) return ''
    const name = files[0]?.name || ''
    const dot = name.lastIndexOf('.')
    const base = dot > 0 ? name.slice(0, dot) : name
    return base.trim()
  }, [files, isSingle])

  const handleClose = () => {
    setIsDragging(false)
    setSubmitting(false)
    setFiles([])
    setTitle('')
    setDescription('')
    setFolderId(selectedFolderId || '')
    onClose()
  }

  const addFiles = (incoming) => {
    const next = []
    for (const file of incoming) {
      const validation = validateFile(file)
      if (!validation.valid) {
        alert(validation.error)
        continue
      }
      next.push(file)
    }
    if (next.length === 0) return
    setFiles((prev) => {
      const byKey = new Map(prev.map((f) => [`${f.name}:${f.size}:${f.lastModified}`, f]))
      next.forEach((f) => byKey.set(`${f.name}:${f.size}:${f.lastModified}`, f))
      return Array.from(byKey.values())
    })
  }

  const handleFileSelect = (e) => {
    if (!e.target.files) return
    addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragging(true)
    if (e.type === 'dragleave') setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files))
    }
  }

  const handleBrowseClick = () => fileInputRef.current?.click()

  const removeFile = (idx) => setFiles((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    if (!folderId) {
      alert('Please select a folder')
      return
    }
    if (files.length === 0) {
      alert('Please select at least one file')
      return
    }

    setSubmitting(true)
    try {
      const payload = {
        folderId,
        title: isSingle ? (title.trim() || derivedSingleTitle) : '',
        description,
        files
      }
      await onSubmit(payload)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleClose} />

      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full">
          <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Upload / Bulk Import</h2>
              <p className="text-sm text-gray-600 mt-1">Single upload dan drag-drop banyak fail dalam satu form</p>
            </div>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="px-6 py-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder</label>
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                >
                  <option value="">Select a folder</option>
                  {(folders || []).map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.icon} {folder.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title (single file)</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={derivedSingleTitle || 'Auto from filename'}
                  disabled={!isSingle}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg outline-none text-sm ${
                    isSingle ? 'focus:ring-2 focus:ring-blue-500 focus:border-blue-500' : 'bg-gray-100 text-gray-500'
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description / Notes</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
              />
            </div>

            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={getAcceptString()}
                className="hidden"
                onChange={handleFileSelect}
              />

              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-900">Drag & drop files here</p>
                <p className="text-xs text-gray-600">Allowed: {getAllowedTypesDisplay()}</p>
                <button
                  type="button"
                  onClick={handleBrowseClick}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse files
                </button>
              </div>
            </div>

            {files.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Selected files ({files.length})</div>
                  <button
                    type="button"
                    onClick={() => setFiles([])}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-56 overflow-auto">
                  {files.map((f, idx) => (
                    <div key={`${f.name}:${f.size}:${f.lastModified}`} className="px-4 py-2 flex items-center justify-between border-b border-gray-100 last:border-b-0">
                      <div className="min-w-0">
                        <div className="text-sm text-gray-900 truncate">{f.name}</div>
                        <div className="text-xs text-gray-500">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
              disabled={submitting}
            >
              {submitting ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

