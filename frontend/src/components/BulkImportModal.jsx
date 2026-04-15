import React, { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import useFileUploadSettings from '../hooks/useFileUploadSettings'
import { usePreferences } from '../contexts/PreferencesContext'

export default function BulkImportModal({ isOpen, onClose, onSubmit, folders, selectedFolderId }) {
  const [folderId, setFolderId] = useState(selectedFolderId || '')
  const [description, setDescription] = useState('')
  const [fileItems, setFileItems] = useState([])
  const [isDragging, setIsDragging] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [documentTypes, setDocumentTypes] = useState([])
  const [numberingSettings, setNumberingSettings] = useState(null)
  const [projectCategories, setProjectCategories] = useState([])
  const fileInputRef = useRef(null)

  const { t } = usePreferences()

  const { validateFile, getAcceptString, getAllowedTypesDisplay } = useFileUploadSettings()

  useEffect(() => {
    if (!isOpen) return
    setFolderId(selectedFolderId || '')
  }, [isOpen, selectedFolderId])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const load = async () => {
      try {
        const [typesRes, projRes] = await Promise.all([
          api.get('/system/config/document-types'),
          api.get('/system/config/project-categories')
        ])
        if (cancelled) return
        setDocumentTypes(typesRes.data?.data?.documentTypes || [])
        setProjectCategories(projRes.data?.data?.projectCategories || [])
      } catch (_) {
        if (cancelled) return
        setDocumentTypes([])
        setProjectCategories([])
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    let cancelled = false
    const load = async () => {
      try {
        const res = await api.get('/system/config/document-numbering')
        if (cancelled) return
        setNumberingSettings(res.data?.data?.settings || res.data?.data || null)
      } catch (_) {
        if (cancelled) return
        setNumberingSettings(null)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (documentTypes.length === 0) return
    setFileItems((prev) => prev.map((it) => {
      if (String(it.documentTypeId || '').trim()) return it
      const matched = autoMatchDocumentTypeId(it.fileCode)
      return matched ? { ...it, documentTypeId: matched } : it
    }))
  }, [documentTypes, isOpen])

  const handleClose = () => {
    setIsDragging(false)
    setSubmitting(false)
    setFileItems([])
    setDescription('')
    setFormError('')
    setDocumentTypes([])
    setNumberingSettings(null)
    setProjectCategories([])
    setFolderId(selectedFolderId || '')
    onClose()
  }

  const getDateDigits = (format) => {
    switch (String(format || '').toUpperCase()) {
      case 'YYMMDD': return 6
      case 'YYYYMMDD': return 8
      case 'YYYYMM': return 6
      case 'YYMM': return 4
      case 'YYYY': return 4
      case 'NONE': return 0
      default: return 0
    }
  }

  const normalizeFileCode = (raw) => {
    const input = String(raw || '').trim()
    if (!input) return ''
    const settings = numberingSettings
    if (!settings) return input

    const prefixLen = Math.max(1, String(settings.prefixPlaceholder || 'PFX').length)
    const includeVersion = Boolean(settings.includeVersion)
    const versionDigits = includeVersion ? Math.max(1, parseInt(settings.versionDigits, 10) || 2) : 0
    const dateDigits = getDateDigits(settings.dateFormat)
    const counterDigits = Math.max(1, parseInt(settings.counterDigits, 10) || 3)
    const sepOut = String(settings.separator || '/')

    const cleaned = input.replace(/\s+/g, '')
    const parts = cleaned.split(/[\/\-\._]+/).filter(Boolean)

    const build = (prefix, version, date, counter) => {
      const p = String(prefix || '').substring(0, prefixLen)
      const segs = [p]
      if (includeVersion) segs.push(String(version || '').padStart(versionDigits, '0'))
      if (dateDigits > 0) segs.push(String(date || '').padStart(dateDigits, '0'))
      segs.push(String(counter || '').padStart(counterDigits, '0'))
      return segs.join(sepOut)
    }

    const isDigits = (s, len) => new RegExp(`^\\d{${len}}$`).test(String(s || ''))
    const isPrefixOk = (s) => new RegExp(`^[A-Za-z]{1,${prefixLen}}$`).test(String(s || ''))

    if (parts.length >= 2) {
      const prefix = parts[0]
      let idx = 1
      const version = includeVersion ? parts[idx++] : ''
      const date = dateDigits > 0 ? parts[idx++] : ''
      const counter = parts[idx++]

      if (
        isPrefixOk(prefix) &&
        (!includeVersion || isDigits(version, versionDigits)) &&
        (dateDigits === 0 || isDigits(date, dateDigits)) &&
        isDigits(counter, counterDigits)
      ) {
        return build(prefix, version, date, counter)
      }
    }

    const m = cleaned.match(new RegExp(`^([A-Za-z]{1,${prefixLen}})(\\d+)$`))
    if (m) {
      const prefix = m[1]
      const digits = m[2]
      const expected = versionDigits + dateDigits + counterDigits
      if (digits.length === expected) {
        let offset = 0
        const version = includeVersion ? digits.slice(offset, offset + versionDigits) : ''
        offset += versionDigits
        const date = dateDigits > 0 ? digits.slice(offset, offset + dateDigits) : ''
        offset += dateDigits
        const counter = digits.slice(offset, offset + counterDigits)
        return build(prefix, version, date, counter)
      }
    }

    return input
  }

  const extractFromFilename = (fileName) => {
    const dot = fileName.lastIndexOf('.')
    const base = dot > 0 ? fileName.slice(0, dot) : fileName
    const trimmed = base.trim()
    const underscore = trimmed.indexOf('_')
    if (underscore > 0) {
      const fileCode = normalizeFileCode(trimmed.slice(0, underscore).trim())
      const title = trimmed.slice(underscore + 1).trim() || trimmed
      return { fileCode, title, fallbackTitle: trimmed }
    }
    const normalized = normalizeFileCode(trimmed)
    return { fileCode: normalized, title: trimmed, fallbackTitle: trimmed }
  }

  const autoMatchDocumentTypeId = (fileCode) => {
    const prefix = String(fileCode || '').match(/^[A-Za-z]+/)?.[0] || ''
    if (!prefix) return ''
    const exact = documentTypes.find((dt) => dt?.prefix === prefix)
    if (exact) return String(exact.id)
    const lower = prefix.toLowerCase()
    const ci = documentTypes.find((dt) => String(dt?.prefix || '').toLowerCase() === lower)
    return ci ? String(ci.id) : ''
  }

  const addFiles = (incoming) => {
    const next = []
    for (const file of incoming) {
      const validation = validateFile(file)
      if (!validation.valid) {
        setFormError(validation.error)
        continue
      }
      next.push(file)
    }
    if (next.length === 0) return
    setFileItems((prev) => {
      const byKey = new Map(prev.map((it) => [`${it.file.name}:${it.file.size}:${it.file.lastModified}`, it]))
      next.forEach((f) => {
        const key = `${f.name}:${f.size}:${f.lastModified}`
        if (byKey.has(key)) return
        const extracted = extractFromFilename(f.name)
        byKey.set(key, {
          file: f,
          fileCode: extracted.fileCode,
          nonClientFileCode: extracted.fileCode,
          title: extracted.title,
          documentTypeId: autoMatchDocumentTypeId(extracted.fileCode),
          projectCategoryId: '',
          isClientDocument: false,
          collapsed: true
        })
      })
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

  const removeFile = (idx) => setFileItems((prev) => prev.filter((_, i) => i !== idx))

  const handleSubmit = async () => {
    setFormError('')
    if (!folderId) {
      setFormError('Please select a folder')
      return
    }
    if (fileItems.length === 0) {
      setFormError('Please select at least one file')
      return
    }
    for (let i = 0; i < fileItems.length; i++) {
      const item = fileItems[i]
      if (!item.isClientDocument && !String(item.fileCode || '').trim()) {
        setFormError(`File code is required for "${item.file.name}"`)
        setFileItems((prev) => prev.map((it, idx) => idx === i ? { ...it, collapsed: false } : it))
        return
      }
      if (!String(item.documentTypeId || '').trim()) {
        setFormError(`Please select document type for "${item.file.name}"`)
        setFileItems((prev) => prev.map((it, idx) => idx === i ? { ...it, collapsed: false } : it))
        return
      }
      if (projectCategories.length > 0 && !String(item.projectCategoryId || '').trim()) {
        setFormError(`Please select project category for "${item.file.name}"`)
        setFileItems((prev) => prev.map((it, idx) => idx === i ? { ...it, collapsed: false } : it))
        return
      }
    }

    setSubmitting(true)
    try {
      const payload = {
        folderId,
        description,
        files: fileItems.map((it) => it.file),
        filesMeta: fileItems.map((it) => ({
          fileCode: String(it.fileCode || '').trim(),
          title: String(it.title || '').trim(),
          documentTypeId: it.documentTypeId ? parseInt(it.documentTypeId) : null,
          projectCategoryId: it.projectCategoryId ? parseInt(it.projectCategoryId) : null,
          isClientDocument: Boolean(it.isClientDocument)
        }))
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
        <div className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full" data-tour-id="bulk-import-modal">
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
            {formError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                {formError}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Folder</label>
                <select
                  value={folderId || ''}
                  onChange={(e) => setFolderId(e.target.value)}
                  data-tour-id="bulk-import-folder"
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
              data-tour-id="bulk-import-dropzone"
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

            {fileItems.length > 0 && (
              <div className="border border-gray-200 rounded-lg">
                <div className="px-4 py-2 border-b border-gray-200 flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-900">Files ({fileItems.length})</div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setFileItems((prev) => prev.map((it) => ({ ...it, collapsed: true })))}
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Collapse all
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileItems((prev) => prev.map((it) => ({ ...it, collapsed: false })))}
                      className="text-sm text-gray-700 hover:text-gray-900 font-medium"
                    >
                      Expand all
                    </button>
                    <button
                      type="button"
                      onClick={() => setFileItems([])}
                      className="text-sm text-red-600 hover:text-red-700 font-medium"
                    >
                      Clear
                    </button>
                  </div>
                </div>
                <div className="max-h-[420px] overflow-auto divide-y divide-gray-100">
                  {fileItems.map((it, idx) => {
                    const matchedType = documentTypes.find((dt) => String(dt.id) === String(it.documentTypeId))
                    const typeLabel = matchedType ? `${matchedType.name} (${matchedType.prefix})` : 'Not selected'
                    const matchedProject = projectCategories.find((pc) => String(pc.id) === String(it.projectCategoryId))
                    const projectLabel = matchedProject ? matchedProject.name : 'Not selected'
                    return (
                      <div key={`${it.file.name}:${it.file.size}:${it.file.lastModified}`} className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => setFileItems((prev) => prev.map((x, i) => i === idx ? { ...x, collapsed: !x.collapsed } : x))}
                          className="w-full flex items-start justify-between gap-3 text-left"
                        >
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{it.file.name}</div>
                            <div className="mt-0.5 text-xs text-gray-600">
                              <span className="font-mono">{it.fileCode || '-'}</span>
                              <span className="mx-2">•</span>
                              <span>{typeLabel}</span>
                              <span className="mx-2">•</span>
                              <span>{projectLabel}</span>
                              <span className="mx-2">•</span>
                              <span>{(it.file.size / 1024 / 1024).toFixed(2)} MB</span>
                              {it.isClientDocument && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span>{t('client_document_label')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              it.documentTypeId && (projectCategories.length === 0 || it.projectCategoryId) ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {it.documentTypeId && (projectCategories.length === 0 || it.projectCategoryId) ? 'Ready' : 'Needs attention'}
                            </span>
                            <svg className={`w-5 h-5 text-gray-500 transition-transform ${it.collapsed ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </button>

                        {!it.collapsed && (
                          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">File code</label>
                              <input
                                type="text"
                                value={it.fileCode}
                                onChange={(e) => {
                                  const nextCode = e.target.value
                                  setFileItems((prev) => prev.map((x, i) => {
                                    if (i !== idx) return x
                                    return {
                                      ...x,
                                      fileCode: nextCode,
                                      nonClientFileCode: x.isClientDocument ? x.nonClientFileCode : nextCode,
                                      documentTypeId: x.documentTypeId || autoMatchDocumentTypeId(nextCode)
                                    }
                                  }))
                                }}
                                disabled={Boolean(it.isClientDocument)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm font-mono"
                              />
                              <p className="mt-1 text-xs text-gray-500">Auto-extracted from filename. You can adjust before upload.</p>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Document type</label>
                              <select
                                value={it.documentTypeId || ''}
                                onChange={(e) => setFileItems((prev) => prev.map((x, i) => i === idx ? { ...x, documentTypeId: e.target.value } : x))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                              >
                                <option value="">Select document type</option>
                                {documentTypes.map((dt) => (
                                  <option key={dt.id} value={dt.id}>
                                    {dt.name} ({dt.prefix})
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Project category</label>
                              <select
                                value={it.projectCategoryId || ''}
                                onChange={(e) => setFileItems((prev) => prev.map((x, i) => i === idx ? { ...x, projectCategoryId: e.target.value } : x))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                              >
                                <option value="">{projectCategories.length > 0 ? 'Select project category' : 'No project categories'}</option>
                                {projectCategories.map((pc) => (
                                  <option key={pc.id} value={pc.id}>
                                    {pc.name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="md:col-span-3">
                              <label className="inline-flex items-start gap-2 text-xs text-gray-700">
                                <input
                                  type="checkbox"
                                  className="mt-0.5"
                                  checked={Boolean(it.isClientDocument)}
                                  onChange={(e) => {
                                    const checked = e.target.checked
                                    setFileItems((prev) => prev.map((x, i) => {
                                      if (i !== idx) return x
                                      return {
                                        ...x,
                                        isClientDocument: checked,
                                        nonClientFileCode: checked ? (x.fileCode || x.nonClientFileCode) : x.nonClientFileCode,
                                        fileCode: checked ? '' : (x.nonClientFileCode || x.fileCode)
                                      }
                                    }))
                                  }}
                                />
                                <span>
                                  {t('client_document_declaration')}
                                </span>
                              </label>
                            </div>

                            <div className="md:col-span-3">
                              <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                              <input
                                type="text"
                                value={it.title}
                                onChange={(e) => setFileItems((prev) => prev.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm"
                              />
                            </div>

                            <div className="md:col-span-3 flex justify-end">
                              <button
                                type="button"
                                onClick={() => removeFile(idx)}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                              >
                                Remove file
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
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
              data-tour-id="bulk-import-submit"
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
