import React, { useEffect, useMemo, useState } from 'react'
import api from '../api/axios'
import BulkImportModal from './BulkImportModal'
import DocumentViewerModal from './DocumentViewerModal'
import SupersedeObsoleteModal from './SupersedeObsoleteModal'
import StatusBadge from './StatusBadge'
import ActionMenu from './ActionMenu'
import EmptyState from './EmptyState'
import Pagination from './Pagination'
import { PermissionGate } from './PermissionGate'
import { hasPermission } from '../utils/permissions'
import ConfirmModal, { AlertModal } from './ConfirmModal'
import { usePreferences } from '../contexts/PreferencesContext'

export default function PublishedDocuments() {
  const { itemsPerPage, formatDate, t } = usePreferences()
  const toFolderId = (v) => {
    if (v === null || v === undefined || v === '') return null
    const n = parseInt(v, 10)
    return Number.isFinite(n) ? n : null
  }
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFolder, setSelectedFolder] = useState(null)
  const [expandedFolders, setExpandedFolders] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(itemsPerPage)
  const [totalDocuments, setTotalDocuments] = useState(0)
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'Root' }])
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false)
  const [showCreateSubFolderModal, setShowCreateSubFolderModal] = useState(false)
  const [showUploadFileModal, setShowUploadFileModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showSupersedeObsoleteModal, setShowSupersedeObsoleteModal] = useState(false)
  const [actionType, setActionType] = useState(null)
  const [selectedDocument, setSelectedDocument] = useState(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [parentFolderForSub, setParentFolderForSub] = useState(null)
  const [userRole, setUserRole] = useState('Admin') // Get from localStorage/context
  const [contextMenuFolder, setContextMenuFolder] = useState(null)
  const [renameModal, setRenameModal] = useState({ show: false, type: '', id: null, currentName: '' })
  const [renameName, setRenameName] = useState('')
  const [renameLoading, setRenameLoading] = useState(false)
  const [renameError, setRenameError] = useState('')
  const [alertModal, setAlertModal] = useState({ show: false, title: '', message: '', type: 'info' })
  const [confirmModal, setConfirmModal] = useState({ show: false, title: '', message: '', onConfirm: null })
  const [accessModalOpen, setAccessModalOpen] = useState(false)
  const [accessFolder, setAccessFolder] = useState(null)
  const [accessLoading, setAccessLoading] = useState(false)
  const [accessError, setAccessError] = useState('')
  const [accessMode, setAccessMode] = useState('PUBLIC')
  const [inheritPermissions, setInheritPermissions] = useState(true)
  const [accessEntries, setAccessEntries] = useState([])
  const [subjects, setSubjects] = useState({ users: [], roles: [] })

  const [createAccessMode, setCreateAccessMode] = useState('PUBLIC')
  const [createInheritPermissions, setCreateInheritPermissions] = useState(true)
  const [createAccessEntries, setCreateAccessEntries] = useState([])
  const [createAccessError, setCreateAccessError] = useState('')
  const [createAccessLoading, setCreateAccessLoading] = useState(false)

  // Folder structure
  const [folders, setFolders] = useState([])

  // Helper function to flatten folder hierarchy for display
  const flattenFolders = (folderList, level = 0, parentPath = []) => {
    let result = []
    folderList.forEach(folder => {
      const currentPath = [...parentPath, folder.name]
      const hasChildren = folder.children && folder.children.length > 0
      
      // Create proper indentation with tree characters
      let prefix = ''
      if (level > 0) {
        prefix = '\u00A0\u00A0'.repeat(level - 1) + '\u2514\u2500 '
      }
      
      result.push({
        id: folder.id,
        name: folder.name,
        displayName: prefix + folder.name,
        level: level,
        path: currentPath.join(' › '),
        fullPath: currentPath,
        hasChildren: hasChildren,
        icon: level === 0 ? '📁' : '📂',
        canCreate: Boolean(folder.canCreate),
        canEdit: Boolean(folder.canEdit),
        canDelete: Boolean(folder.canDelete),
        canDownload: Boolean(folder.canDownload),
        canManage: Boolean(folder.canManage)
      })
      if (hasChildren) {
        result = result.concat(flattenFolders(folder.children, level + 1, currentPath))
      }
    })
    return result
  }

  const buildBreadcrumbsFrom = (folderTree, folderId) => {
    const fid = toFolderId(folderId)
    if (!fid) return [{ id: null, name: 'Root' }]
    const findFolder = (foldersList, id, path = []) => {
      for (const folder of foldersList) {
        const currentPath = [...path, { id: folder.id, name: folder.name }]
        if (toFolderId(folder.id) === id) return currentPath
        if (folder.children && folder.children.length > 0) {
          const found = findFolder(folder.children, id, currentPath)
          if (found) return found
        }
      }
      return null
    }
    const path = findFolder(folderTree || [], fid) || []
    return [{ id: null, name: 'Root' }, ...path]
  }

  // Build breadcrumbs for a folder
  const buildBreadcrumbs = (folderId) => buildBreadcrumbsFrom(folders, folderId)

  // Get flattened folders for dropdown
  const flatFolders = flattenFolders(folders)
  const selectedFolderMeta = useMemo(() => {
    if (!selectedFolder) return null
    return flatFolders.find((f) => f.id === selectedFolder) || null
  }, [flatFolders, selectedFolder])
  const canCreateInSelected = Boolean(selectedFolderMeta?.canCreate)
  const canDownloadSelected = Boolean(selectedFolderMeta?.canDownload)
  const hasAnyCreatableFolder = useMemo(() => flatFolders.some((f) => Boolean(f.canCreate)), [flatFolders])

  useEffect(() => {
    loadFolders()
    loadUserRole()
  }, [])

  useEffect(() => {
    loadDocuments()
  }, [selectedFolder, searchQuery, currentPage, pageSize, folders])

  const loadUserRole = () => {
    // Get user role from localStorage
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        console.log('User data from localStorage:', user) // Debug log
        const role = user.role || user.roles?.[0]?.role?.name || 'Viewer'
        console.log('Detected role:', role) // Debug log
        setUserRole(role)
      } catch (e) {
        console.error('Failed to parse user data', e)
        setUserRole('Viewer')
      }
    } else {
      console.log('No user data in localStorage') // Debug log
    }
  }

  // Check if user has admin permissions
  const isAdmin = ['Admin', 'Administrator', 'ADMIN', 'admin'].includes(userRole)

  const loadFolders = async () => {
    try {
      const res = await api.get('/folders')
      const list = res.data.data.folders || []
      setFolders(list)
      return list
    } catch (error) {
      console.error('Failed to load folders:', error)
      return []
    }
  }

  const openRename = (type, id, currentName) => {
    setRenameError('')
    setRenameLoading(false)
    setRenameName(String(currentName || ''))
    setRenameModal({ show: true, type, id, currentName: String(currentName || '') })
  }

  const closeRename = () => {
    setRenameModal({ show: false, type: '', id: null, currentName: '' })
    setRenameName('')
    setRenameError('')
    setRenameLoading(false)
  }

  const submitRename = async () => {
    const name = String(renameName || '').trim()
    if (!renameModal?.id) return
    if (!name) {
      setRenameError('Name is required')
      return
    }
    setRenameLoading(true)
    setRenameError('')
    try {
      if (renameModal.type === 'folder') {
        await api.put(`/folders/${renameModal.id}`, { name })
        const list = await loadFolders()
        if (selectedFolder) {
          setBreadcrumbs(buildBreadcrumbsFrom(list, selectedFolder))
        }
        setAlertModal({ show: true, title: 'Success', message: 'Folder renamed successfully', type: 'success' })
      } else if (renameModal.type === 'file') {
        await api.put(`/documents/${renameModal.id}/rename`, { fileName: name })
        await loadDocuments()
        setAlertModal({ show: true, title: 'Success', message: 'File renamed successfully', type: 'success' })
      }
      closeRename()
    } catch (e) {
      setRenameError(e?.response?.data?.message || 'Failed to rename')
    } finally {
      setRenameLoading(false)
    }
  }

  const loadSubjectsIfNeeded = async () => {
    if ((subjects.users || []).length > 0 || (subjects.roles || []).length > 0) return
    try {
      const subjRes = await api.get('/folders/access/subjects')
      setSubjects({ users: subjRes.data?.data?.users || [], roles: subjRes.data?.data?.roles || [] })
    } catch {
    }
  }

  const resetCreateAccess = () => {
    setCreateAccessMode('PUBLIC')
    setCreateInheritPermissions(true)
    setCreateAccessEntries([])
    setCreateAccessError('')
    setCreateAccessLoading(false)
  }

  const applyCreateAccessToFolder = async (folderId) => {
    const payload = {
      accessMode: createAccessMode,
      inheritPermissions: createInheritPermissions,
      entries: createAccessEntries.map((e) => ({
        subjectType: e.subjectType,
        subjectId: e.subjectId,
        canView: Boolean(e.canView),
        canCreate: Boolean(e.canCreate),
        canEdit: Boolean(e.canEdit),
        canDelete: Boolean(e.canDelete),
        canDownload: Boolean(e.canDownload)
      }))
    }
    await api.put(`/folders/${folderId}/access`, payload)
  }

  // Get child folders of current folder
  const getChildFolders = (folderId) => {
    const fid = toFolderId(folderId)
    if (!fid) {
      return folders || []
    }
    
    // Find the folder and return its children
    const findChildren = (folderList) => {
      for (const folder of folderList) {
        if (toFolderId(folder.id) === fid) {
          return folder.children || []
        }
        if (folder.children && folder.children.length > 0) {
          const found = findChildren(folder.children)
          if (found !== null) return found
        }
      }
      return null
    }
    
    return findChildren(folders) || []
  }

  const loadDocuments = async () => {
    try {
      setLoading(true)
      const childFolders = getChildFolders(selectedFolder)
      const folderItems = childFolders.map(folder => ({
        id: `folder-${folder.id}`,
        folderId: folder.id,
        isFolder: true,
        fileCode: '-',
        fileName: folder.name,
        type: 'File folder',
        size: '-',
        lastModified: folder.createdAt ? formatDate(folder.createdAt) : '-',
        status: '-'
      }))

      if (!selectedFolder) {
        setDocuments(folderItems)
        setTotalDocuments(0)
        return
      }

      const params = new URLSearchParams({
        page: currentPage,
        limit: pageSize,
        folderId: selectedFolder
      })
      
      if (searchQuery) params.append('search', searchQuery)

      const res = await api.get(`/documents/published?${params}`)
      const combinedItems = [...folderItems, ...(res.data.data || [])]
      setDocuments(combinedItems)
      setTotalDocuments(res.data.pagination?.totalItems || 0)
    } catch (error) {
      console.error('Failed to load published documents:', error)
      setDocuments([])
      setTotalDocuments(0)
    } finally {
      setLoading(false)
    }
  }

  const toggleFolder = (folderId) => {
    setExpandedFolders(prev =>
      prev.includes(folderId)
        ? prev.filter(f => f !== folderId)
        : [...prev, folderId]
    )
  }

  // Auto-expand folder tree to show the path to selected folder
  const expandPathToFolder = (folderId) => {
    const targetId = toFolderId(folderId)
    if (!targetId) return
    const findPathIds = (folders, targetId, path = []) => {
      for (const folder of folders) {
        const id = toFolderId(folder.id)
        const currentPath = [...path, id]
        if (id === targetId) {
          return currentPath.slice(0, -1) // Return all parent IDs, not including the target itself
        }
        if (folder.children && folder.children.length > 0) {
          const found = findPathIds(folder.children, targetId, currentPath)
          if (found) return found
        }
      }
      return null
    }
    
    const pathIds = findPathIds(folders, targetId)
    if (pathIds) {
      setExpandedFolders(prev => {
        // Add all parent folder IDs to expanded folders
        const newExpanded = new Set([...prev, ...pathIds])
        return Array.from(newExpanded)
      })
    }
  }

  const handleDownload = async (doc) => {
    try {
      const res = await api.get(`/documents/${doc.id}/download`, {
        responseType: 'blob'
      })
      
      const contentDisposition = res.headers?.['content-disposition'] || ''
      const contentTypeHeader = res.headers?.['content-type'] || ''
      const getFileNameFromContentDisposition = (value) => {
        const v = String(value || '')
        const mStar = v.match(/filename\*\s*=\s*UTF-8''([^;]+)/i)
        if (mStar && mStar[1]) {
          try {
            return decodeURIComponent(mStar[1].trim().replace(/^"|"$/g, ''))
          } catch {
            return mStar[1].trim().replace(/^"|"$/g, '')
          }
        }
        const m = v.match(/filename\s*=\s*("?)([^";]+)\1/i)
        if (m && m[2]) return m[2].trim()
        return null
      }

      const fallbackName = doc.fileName || doc.title || `document-${doc.id}`
      const downloadName = getFileNameFromContentDisposition(contentDisposition) || fallbackName
      const url = window.URL.createObjectURL(new Blob([res.data], { type: contentTypeHeader || undefined }))
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', downloadName)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download document:', error)
      setAlertModal({ show: true, title: 'Error', message: 'Failed to download document', type: 'error' })
    }
  }

  const handleDownloadFolder = async (folder) => {
    try {
      const res = await api.get(`/folders/${folder.id}/download`, {
        responseType: 'blob'
      })

      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/zip' }))
      const link = window.document.createElement('a')
      link.href = url
      link.setAttribute('download', `${folder.name || 'folder'}.zip`)
      window.document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download folder:', error)
      setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to download folder', type: 'error' })
    }
  }
  
  const handleView = (doc) => {
    setSelectedDocument(doc)
    setShowViewModal(true)
  }
  
  const handleObsolete = (doc) => {
    if (!isAdmin) {
      setAlertModal({ show: true, title: 'Permission Denied', message: 'You do not have permission to obsolete documents. Only Admins can perform this action.', type: 'warning' })
      return
    }
    
    setSelectedDocument(doc)
    setActionType('OBSOLETE')
    setShowSupersedeObsoleteModal(true)
  }
  
  const handleSupersede = (doc) => {
    if (!isAdmin) {
      setAlertModal({ show: true, title: 'Permission Denied', message: 'You do not have permission to supersede documents. Only Admins can perform this action.', type: 'warning' })
      return
    }
    
    setSelectedDocument(doc)
    setActionType('SUPERSEDE')
    setShowSupersedeObsoleteModal(true)
  }
  
  const handleSupersedeObsoleteSubmit = () => {
    setAlertModal({ show: true, title: 'Success', message: 'Supersede/Obsolete request submitted successfully! It will go through review and approval.', type: 'success' })
    loadDocuments()
  }

  const handleDelete = async (doc) => {
    if (!isAdmin) {
      setAlertModal({ show: true, title: 'Permission Denied', message: 'You do not have permission to delete files. Only Admins can delete files.', type: 'warning' })
      return
    }
    
    setConfirmModal({
      show: true,
      title: 'Confirm Admin Delete',
      message: `Are you sure you want to permanently delete "${doc.fileName}"? This will remove the record from the database. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal({ show: false })
        try {
          await api.delete(`/documents/${doc.id}/purge`)
          setAlertModal({ show: true, title: 'Success', message: `${doc.fileName} has been permanently deleted successfully`, type: 'success' })
          loadDocuments()
        } catch (error) {
          console.error('Failed to delete document:', error)
          setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to delete document', type: 'error' })
        }
      }
    })
  }

  const handleDeleteFolder = async (folderId, folderName) => {
    if (!isAdmin) {
      setAlertModal({ show: true, title: 'Permission Denied', message: 'You do not have permission to delete folders. Only Admins can delete folders.', type: 'warning' })
      return
    }

    setConfirmModal({
      show: true,
      title: 'Confirm Admin Delete',
      message: `Are you sure you want to permanently delete the folder "${folderName}" and everything inside it? This will remove folder and file records from the database. This action cannot be undone.`,
      onConfirm: async () => {
        setConfirmModal({ show: false })
        try {
          await api.delete(`/folders/${folderId}/purge`)
          setAlertModal({ show: true, title: 'Success', message: `Folder "${folderName}" has been permanently deleted successfully`, type: 'success' })
          loadFolders()
          if (selectedFolder === folderId) {
            setSelectedFolder(null)
          }
        } catch (error) {
          console.error('Failed to delete folder:', error)
          setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to delete folder', type: 'error' })
        }
      }
    })
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      setAlertModal({ show: true, title: 'Validation Error', message: 'Please enter a folder name', type: 'warning' })
      return
    }

    try {
      setCreateAccessLoading(true)
      setCreateAccessError('')
      const resp = await api.post('/folders', { name: newFolderName })
      const createdFolder = resp?.data?.data?.folder
      const folderNameCopy = newFolderName
      setNewFolderName('')
      setShowCreateFolderModal(false)
      setAlertModal({ show: true, title: 'Success', message: `Folder "${folderNameCopy}" created successfully!`, type: 'success' })
      if (createdFolder?.id) {
        try {
          await applyCreateAccessToFolder(createdFolder.id)
        } catch (e) {
          setAlertModal({ show: true, title: 'Warning', message: e?.response?.data?.message || 'Folder created but failed to set access rules', type: 'warning' })
        }
      }
      await loadFolders()
      if (createdFolder?.id) {
        setSelectedFolder(createdFolder.id)
        setBreadcrumbs([{ id: null, name: 'Root' }, { id: createdFolder.id, name: createdFolder.name }])
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Failed to create folder:', error)
      setCreateAccessError(error.response?.data?.message || 'Failed to create folder')
      setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to create folder', type: 'error' })
    } finally {
      setCreateAccessLoading(false)
    }
  }

  const handleCreateSubFolder = async () => {
    if (!parentFolderForSub) {
      setAlertModal({ show: true, title: 'Validation Error', message: 'Please select a parent folder', type: 'warning' })
      return
    }
    if (!newFolderName.trim()) {
      setAlertModal({ show: true, title: 'Validation Error', message: 'Please enter a subfolder name', type: 'warning' })
      return
    }

    try {
      setCreateAccessLoading(true)
      setCreateAccessError('')
      const resp = await api.post('/folders', { 
        name: newFolderName,
        parentId: parentFolderForSub 
      })
      const createdFolder = resp?.data?.data?.folder
      const folderNameCopy = newFolderName
      setNewFolderName('')
      setParentFolderForSub(null)
      setShowCreateSubFolderModal(false)
      setAlertModal({ show: true, title: 'Success', message: `Subfolder "${folderNameCopy}" created successfully!`, type: 'success' })
      if (createdFolder?.id) {
        try {
          await applyCreateAccessToFolder(createdFolder.id)
        } catch (e) {
          setAlertModal({ show: true, title: 'Warning', message: e?.response?.data?.message || 'Subfolder created but failed to set access rules', type: 'warning' })
        }
      }
      await loadFolders()
      if (parentFolderForSub) {
        setExpandedFolders((prev) => prev.includes(parentFolderForSub) ? prev : [...prev, parentFolderForSub])
      }
      if (createdFolder?.id && selectedFolder === parentFolderForSub) {
        setCurrentPage(1)
      }
    } catch (error) {
      console.error('Failed to create subfolder:', error)
      setCreateAccessError(error.response?.data?.message || 'Failed to create subfolder')
      setAlertModal({ show: true, title: 'Error', message: error.response?.data?.message || 'Failed to create subfolder', type: 'error' })
    } finally {
      setCreateAccessLoading(false)
    }
  }

  const handleUploadFile = async (uploadData) => {
    try {
      const formData = new FormData()
      formData.append('folderId', uploadData.folderId)
      if (uploadData.description) formData.append('description', uploadData.description)
      if (uploadData.filesMeta) formData.append('filesMeta', JSON.stringify(uploadData.filesMeta))
      if (uploadData.allowReassign) formData.append('allowReassign', 'true')
      uploadData.files.forEach((file) => formData.append('files', file))

      const importResponse = await api.post('/documents/bulk-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      setShowUploadFileModal(false)
      const counts = importResponse?.data?.data?.counts
      const importedCount = counts?.imported ?? 0
      const failedCount = counts?.failed ?? 0
      const failedList = importResponse?.data?.data?.failed || []
      const failedPreview = failedList
        .slice(0, 5)
        .map((f) => `Line ${f.lineNumber || '-'} - ${f.fileName}: ${f.message}`)
        .join('\n')
      const msg = failedCount > 0
        ? `Imported ${importedCount} file(s). Rejected ${failedCount} file(s).${failedPreview ? `\n\n${failedPreview}` : ''}`
        : `Imported ${importedCount} file(s) successfully.`
      setAlertModal({ show: true, title: 'Success', message: msg, type: failedCount > 0 ? 'warning' : 'success' })

      const targetFolderId = toFolderId(uploadData.folderId)
      const list = await loadFolders()
      const findPathIds = (foldersList, targetId, path = []) => {
        for (const folder of foldersList) {
          const id = toFolderId(folder.id)
          const currentPath = [...path, id]
          if (id === targetId) return currentPath
          if (folder.children && folder.children.length > 0) {
            const found = findPathIds(folder.children, targetId, currentPath)
            if (found) return found
          }
        }
        return null
      }

      const fullPath = targetFolderId ? findPathIds(list || [], targetFolderId) : null
      if (fullPath && fullPath.length > 0) {
        setExpandedFolders((prev) => Array.from(new Set([...prev, ...fullPath])))
      } else if (targetFolderId) {
        setExpandedFolders((prev) => (prev.includes(targetFolderId) ? prev : prev.concat([targetFolderId])))
      }

      if (selectedFolder) {
        setBreadcrumbs(buildBreadcrumbsFrom(list || [], selectedFolder))
      }
    } catch (error) {
      console.error('Error:', error)
      console.error('Response:', error.response?.data)
      const status = error?.response?.status
      const apiMsg = error?.response?.data?.message
      const apiErrors = error?.response?.data?.errors
      const errMsg = String(error?.message || '')

      if (status === 409 && Array.isArray(apiErrors) && apiErrors.some((e) => e?.requestedFileCode && e?.suggestedFileCode)) {
        throw error
      }

      let message = apiMsg || t('bulk_import_upload_failed_generic')

      if (status === 413) {
        message = t('bulk_import_upload_failed_413')
      } else if (status === 400 && Array.isArray(apiErrors) && apiErrors.length > 0) {
        const preview = apiErrors
          .slice(0, 3)
          .map((e) => e?.message)
          .filter(Boolean)
          .join('\n')
        message = preview ? `${apiMsg || t('bulk_import_upload_failed_validation')}\n${preview}` : (apiMsg || t('bulk_import_upload_failed_validation'))
      } else if (!status && (errMsg.includes('ERR_HTTP2_PROTOCOL_ERROR') || errMsg.toLowerCase().includes('protocol error') || errMsg.toLowerCase().includes('network error'))) {
        message = t('bulk_import_upload_failed_http2')
      }

      setAlertModal({ show: true, title: 'Error', message, type: 'error' })
    }
  }

  // Pagination
  const totalPages = Math.ceil(totalDocuments / pageSize)
  const currentDocuments = documents

  const handlePageChange = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handlePageSizeChange = (newPageSize) => {
    setPageSize(newPageSize)
    setCurrentPage(1)
  }

  const openManageAccess = async (folder) => {
    setAccessFolder(folder)
    setAccessModalOpen(true)
    setAccessLoading(true)
    setAccessError('')
    try {
      const [cfgRes, subjRes] = await Promise.all([
        api.get(`/folders/${folder.id}/access`),
        api.get('/folders/access/subjects')
      ])
      const cfg = cfgRes.data?.data || {}
      setAccessMode(String(cfg.folder?.accessMode || 'PUBLIC').toUpperCase())
      setInheritPermissions(Boolean(cfg.folder?.inheritPermissions))
      const entries = (cfg.permissions || []).map((p) => {
        const subjectType = p.userId ? 'USER' : 'ROLE'
        const subjectId = p.userId || p.roleId
        const label = p.userId
          ? `${p.user?.email || ''}`.trim()
          : `${p.role?.displayName || p.role?.name || ''}`.trim()
        return {
          subjectType,
          subjectId,
          label,
          canView: Boolean(p.canView),
          canCreate: Boolean(p.canCreate),
          canEdit: Boolean(p.canEdit),
          canDelete: Boolean(p.canDelete),
          canDownload: Boolean(p.canDownload)
        }
      })
      setAccessEntries(entries)
      setSubjects({ users: subjRes.data?.data?.users || [], roles: subjRes.data?.data?.roles || [] })
    } catch (e) {
      setAccessError(e?.response?.data?.message || 'Failed to load folder access')
    } finally {
      setAccessLoading(false)
    }
  }

  const closeManageAccess = () => {
    setAccessModalOpen(false)
    setAccessFolder(null)
    setAccessLoading(false)
    setAccessError('')
    setAccessEntries([])
    setSubjects({ users: [], roles: [] })
  }

  const saveManageAccess = async () => {
    if (!accessFolder) return
    setAccessLoading(true)
    setAccessError('')
    try {
      const payload = {
        accessMode,
        inheritPermissions,
        entries: accessEntries.map((e) => ({
          subjectType: e.subjectType,
          subjectId: e.subjectId,
          canView: Boolean(e.canView),
          canCreate: Boolean(e.canCreate),
          canEdit: Boolean(e.canEdit),
          canDelete: Boolean(e.canDelete),
          canDownload: Boolean(e.canDownload)
        }))
      }
      await api.put(`/folders/${accessFolder.id}/access`, payload)
      closeManageAccess()
      await loadFolders()
      setAlertModal({ show: true, title: 'Saved', message: 'Folder access updated.', type: 'success' })
    } catch (e) {
      setAccessError(e?.response?.data?.message || 'Failed to save folder access')
    } finally {
      setAccessLoading(false)
    }
  }

  // Recursive component for rendering folder tree
  const FolderTreeItem = ({ folder, level = 0 }) => {
    const hasChildren = Boolean((folder.children && folder.children.length > 0) || (Number(folder.childrenCount) > 0))
    const isExpanded = expandedFolders.includes(folder.id)
    const isSelected = selectedFolder === folder.id
    const [showContextMenu, setShowContextMenu] = useState(false)
    const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 })

    const handleContextMenu = (e) => {
      e.preventDefault()
      e.stopPropagation()
      if (folder?.canManage || folder?.canEdit || isAdmin) {
        setContextMenuPosition({ x: e.clientX, y: e.clientY })
        setShowContextMenu(true)
        setContextMenuFolder(folder.id)
      }
    }

    const handleClick = (e) => {
      e.stopPropagation()
      const id = toFolderId(folder.id)
      setSelectedFolder(id)
      setBreadcrumbs(buildBreadcrumbs(id))
      // Expand this folder when clicked
      if (hasChildren && !isExpanded) {
        toggleFolder(id)
      }
    }

    return (
      <div key={folder.id}>
        <div
          className={`flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded cursor-pointer group relative ${
            isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''
          }`}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          style={{ paddingLeft: `${12 + level * 20}px` }}
        >
          <span className="text-gray-500">{level === 0 ? '📁' : '📂'}</span>
          <span className="flex-1">{folder.name}</span>
          <div className="flex items-center gap-1">
            {hasChildren && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  toggleFolder(folder.id)
                }}
                className="p-1 rounded hover:bg-gray-200 transition-colors"
                aria-label={isExpanded ? 'Collapse folder' : 'Expand folder'}
              >
                <svg
                  className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>
        {isExpanded && hasChildren && (
          <div>
            {(folder.children || []).length === 0 && folder.childrenCount > 0 ? (
              <div
                className="px-3 py-2 text-xs text-gray-500"
                style={{ paddingLeft: `${12 + (level + 1) * 20}px` }}
              >
                No accessible subfolders
              </div>
            ) : (
              folder.children.map((child) => (
                <FolderTreeItem key={child.id} folder={child} level={level + 1} />
              ))
            )}
          </div>
        )}

        {/* Right-click Context Menu */}
        {showContextMenu && contextMenuFolder === folder.id && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowContextMenu(false)}
            />
            <div 
              className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 py-1 min-w-[160px]"
              style={{ 
                left: `${contextMenuPosition.x}px`, 
                top: `${contextMenuPosition.y}px` 
              }}
            >
              {folder?.canDownload && (
                <button
                  onClick={() => {
                    setShowContextMenu(false)
                    handleDownloadFolder(folder)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  {t('download_folder')}
                </button>
              )}
              {(folder?.canEdit || folder?.canManage || isAdmin) && (
                <button
                  onClick={() => {
                    setShowContextMenu(false)
                    openRename('folder', folder.id, folder.name)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Rename
                </button>
              )}
              {folder?.canManage && (
                <button
                  onClick={() => {
                    setShowContextMenu(false)
                    openManageAccess(folder)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Manage Access
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => {
                    setShowContextMenu(false)
                    handleDeleteFolder(folder.id, folder.name)
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  Delete as Admin
                </button>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 bg-gray-50">
      {/* Modal Components */}
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

      {renameModal.show && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeRename} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{renameModal.type === 'folder' ? 'Rename Folder' : 'Rename File'}</h2>
                  <p className="text-sm text-gray-600 mt-1">{renameModal.currentName}</p>
                </div>
                <button onClick={closeRename} className="text-gray-400 hover:text-gray-600 transition-colors" disabled={renameLoading}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-4 space-y-3 overflow-y-auto max-h-[70vh]">
                {renameError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {renameError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New name</label>
                  <input
                    type="text"
                    value={renameName}
                    onChange={(e) => setRenameName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    autoFocus
                    disabled={renameLoading}
                  />
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeRename}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={renameLoading}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={submitRename}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  disabled={renameLoading}
                >
                  {renameLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {accessModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={closeManageAccess} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
              <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Folder Access</h2>
                  <p className="text-sm text-gray-600 mt-1">{accessFolder?.name || ''}</p>
                </div>
                <button onClick={closeManageAccess} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[70vh]">
                {accessError && (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                    {accessError}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Access mode</label>
                    <select
                      value={accessMode}
                      onChange={(e) => setAccessMode(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                      disabled={accessLoading}
                    >
                      <option value="PUBLIC">Public (default)</option>
                      <option value="RESTRICTED">Restricted</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 flex items-end">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={Boolean(inheritPermissions)}
                        onChange={(e) => setInheritPermissions(e.target.checked)}
                        disabled={accessLoading || accessMode !== 'RESTRICTED'}
                      />
                      Inherit permissions from parent (if no explicit rule)
                    </label>
                  </div>
                </div>

                {accessMode === 'RESTRICTED' && (
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                      <div className="text-sm font-medium text-gray-900">Rules</div>
                      <button
                        type="button"
                        onClick={() => setAccessEntries((prev) => prev.concat([{
                          subjectType: 'USER',
                          subjectId: subjects.users?.[0]?.id || null,
                          label: subjects.users?.[0]?.email || '',
                          canView: true,
                          canCreate: true,
                          canEdit: true,
                          canDelete: true,
                          canDownload: true
                        }]))}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        disabled={accessLoading}
                      >
                        Add rule
                      </button>
                    </div>
                    <div className="max-h-[360px] overflow-auto divide-y divide-gray-100">
                      {accessEntries.length === 0 ? (
                        <div className="px-4 py-4 text-sm text-gray-600">No rules yet. Add at least one rule.</div>
                      ) : accessEntries.map((r, idx) => (
                        <div key={`${r.subjectType}-${r.subjectId}-${idx}`} className="px-4 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                          <div className="lg:col-span-4">
                            <select
                              value={`${r.subjectType}:${r.subjectId || ''}`}
                              onChange={(e) => {
                                const [st, sid] = String(e.target.value).split(':')
                                const id = sid ? parseInt(sid, 10) : null
                                const label = st === 'ROLE'
                                  ? (subjects.roles.find((x) => x.id === id)?.displayName || subjects.roles.find((x) => x.id === id)?.name || '')
                                  : (subjects.users.find((x) => x.id === id)?.email || '')
                                setAccessEntries((prev) => prev.map((x, i) => i === idx ? { ...x, subjectType: st, subjectId: id, label } : x))
                              }}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                              disabled={accessLoading}
                            >
                              <optgroup label="Users">
                                {(subjects.users || []).map((u) => (
                                  <option key={`U-${u.id}`} value={`USER:${u.id}`}>{u.email}</option>
                                ))}
                              </optgroup>
                              <optgroup label="Roles">
                                {(subjects.roles || []).map((ro) => (
                                  <option key={`R-${ro.id}`} value={`ROLE:${ro.id}`}>{ro.displayName || ro.name}</option>
                                ))}
                              </optgroup>
                            </select>
                          </div>
                          <div className="lg:col-span-7 flex flex-wrap gap-3 text-sm text-gray-700">
                            {['View', 'Create', 'Edit', 'Delete', 'Download'].map((label) => {
                              const key = `can${label}` 
                              return (
                                <label key={label} className="inline-flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(r[key])}
                                    onChange={(e) => setAccessEntries((prev) => prev.map((x, i) => i === idx ? { ...x, [key]: e.target.checked } : x))}
                                    disabled={accessLoading}
                                  />
                                  {label}
                                </label>
                              )
                            })}
                          </div>
                          <div className="lg:col-span-1 flex justify-end">
                            <button
                              type="button"
                              onClick={() => setAccessEntries((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-sm text-red-600 hover:text-red-700 font-medium"
                              disabled={accessLoading}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={closeManageAccess}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                  disabled={accessLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={saveManageAccess}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60"
                  disabled={accessLoading}
                >
                  {accessLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Left Sidebar - Folder Tree */}
      <div className="w-72 lg:w-80 xl:w-96 xl:shrink-0 bg-white border-r border-gray-200 overflow-y-auto" data-tour-id="pub-folder-tree">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700">{t('pub_folders')}</h3>
            <button
              type="button"
              onClick={async () => {
                const list = await loadFolders()
                if (selectedFolder) setBreadcrumbs(buildBreadcrumbsFrom(list || [], selectedFolder))
              }}
              className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 transition-colors"
              aria-label={t('refresh')}
              title={t('refresh')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v6h6M20 20v-6h-6M20 9A8 8 0 006.34 5.34L4 10m16 4l-2.34 4.66A8 8 0 0017.66 18.66L20 14" />
              </svg>
            </button>
          </div>
          <div className="space-y-1">
            {folders.map((folder) => (
              <FolderTreeItem key={folder.id} folder={folder} level={0} />
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-3 sm:p-4 lg:p-6">
          {/* Page Header */}
          <div className="mb-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{t('published_documents')}</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {t('pub_desc')}
                </p>
              </div>
              
            </div>
          </div>

          {/* Action Buttons and Search */}
          <div className="card p-4 mb-6" data-tour-id="pub-actions-card">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              {/* Breadcrumbs */}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                {breadcrumbs.map((crumb, index) => (
                  <React.Fragment key={index}>
                    {index > 0 && <span>›</span>}
                    {index === breadcrumbs.length - 1 ? (
                      <span className="font-medium text-gray-900">{crumb.name}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          const id = toFolderId(crumb.id)
                          setSelectedFolder(id)
                          setBreadcrumbs(buildBreadcrumbs(id))
                          setCurrentPage(1)
                        }}
                        className="hover:text-gray-900 hover:underline"
                      >
                        {crumb.name}
                      </button>
                    )}
                  </React.Fragment>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <PermissionGate module="documents.published" action="create">
                  <button 
                    onClick={async () => {
                      resetCreateAccess()
                      await loadSubjectsIfNeeded()
                      setShowCreateFolderModal(true)
                    }}
                    data-tour-id="pub-btn-create-folder"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    {t('create_new_folder')}
                  </button>
                </PermissionGate>
                <PermissionGate module="documents.published" action="create">
                  <button 
                    onClick={() => {
                      if (!hasAnyCreatableFolder) {
                        setAlertModal({ show: true, title: 'Access denied', message: 'You do not have permission to create folders here.', type: 'error' })
                        return
                      }
                      resetCreateAccess()
                      loadSubjectsIfNeeded()
                      setParentFolderForSub(toFolderId(selectedFolder))
                      setShowCreateSubFolderModal(true)
                    }}
                    data-tour-id="pub-btn-create-subfolder"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      hasAnyCreatableFolder ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!hasAnyCreatableFolder}
                  >
                    {t('create_new_subfolder')}
                  </button>
                </PermissionGate>
                <PermissionGate module="documents.published" action="create">
                  <button 
                    onClick={() => {
                      if (!selectedFolder) {
                        setAlertModal({ show: true, title: 'Folder required', message: 'Please select a folder first.', type: 'error' })
                        return
                      }
                      if (!canCreateInSelected) {
                        setAlertModal({ show: true, title: 'Access denied', message: 'You do not have permission to upload in this folder.', type: 'error' })
                        return
                      }
                      setShowUploadFileModal(true)
                    }}
                    data-tour-id="pub-btn-upload-import"
                    className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
                      selectedFolder && canCreateInSelected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                    disabled={!selectedFolder || !canCreateInSelected}
                    title={!selectedFolder ? 'Select a folder first' : (!canCreateInSelected ? 'No upload permission' : '')}
                  >
                    {t('upload_file')}
                  </button>
                </PermissionGate>
                {selectedFolder && canDownloadSelected && selectedFolderMeta && (
                  <button
                    type="button"
                    onClick={() => handleDownloadFolder(selectedFolderMeta)}
                    className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    {t('download_folder')}
                  </button>
                )}
              </div>
            </div>

            {/* Search Bar */}
            <div className="mt-4 relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder={t('search_files')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
            </div>
          </div>

          {/* Documents Table */}
          <div className="card overflow-hidden" data-tour-id="pub-docs-table">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('file_code')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('file_name')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('type')}</th>
                    <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('size')}</th>
                    <th className="hidden xl:table-cell text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('last_modified')}</th>
                    <th className="hidden lg:table-cell text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('status')}</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 text-xs uppercase tracking-wide">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center py-8 text-gray-500">
                        <div className="flex flex-col items-center gap-2">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span>{t('loading_documents')}</span>
                        </div>
                      </td>
                    </tr>
                  ) : currentDocuments.length === 0 ? (
                    <tr>
                      <td colSpan="7">
                        <EmptyState 
                          message={selectedFolder ? t('no_documents') : t('select_folder_view')} 
                          description={searchQuery ? t('adjust_search') : selectedFolder ? t('no_published_in_folder') : t('click_folder_view')}
                          actionLabel={searchQuery ? t('clear_search') : selectedFolder ? t('upload_file') : null}
                          onAction={searchQuery ? () => setSearchQuery('') : selectedFolder ? () => setShowUploadFileModal(true) : null}
                        />
                      </td>
                    </tr>
                  ) : (
                    currentDocuments.map((doc) => (
                      <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => {
                          if (doc.isFolder) {
                            setSelectedFolder(doc.folderId)
                            setBreadcrumbs(buildBreadcrumbs(doc.folderId))
                            // Auto-expand the entire path to this folder in the sidebar tree
                            expandPathToFolder(doc.folderId)
                            // Also expand the folder itself if it has children
                            if (!expandedFolders.includes(doc.folderId)) {
                              setExpandedFolders(prev => [...prev, doc.folderId])
                            }
                          }
                        }}
                      >
                        <td className="py-4 px-4">
                          <span className="text-gray-900 font-medium text-sm">
                            {doc.fileCode || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center">
                            <span className={doc.isFolder ? "text-gray-900 font-medium" : "text-blue-600 hover:text-blue-700 font-medium"}>
                              {doc.fileName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-700">{doc.type}</td>
                        <td className="hidden lg:table-cell py-4 px-4 text-gray-700">{doc.size}</td>
                        <td className="hidden xl:table-cell py-4 px-4 text-gray-700 text-sm">{doc.lastModified}</td>
                        <td className="hidden lg:table-cell py-4 px-4">
                          {doc.status !== '-' ? <StatusBadge status={doc.status} /> : <span className="text-gray-500">-</span>}
                        </td>
                        <td className="py-4 px-4">
                          {!doc.isFolder && (
                            <ActionMenu
                              actions={[
                                ...(hasPermission('documents.published', 'read')
                                  ? [
                                      ...(doc.canDownload ? [{ label: t('download'), onClick: () => handleDownload(doc) }] : []),
                                      { label: t('view'), onClick: () => handleView(doc) }
                                    ]
                                  : []
                                ),
                                ...(hasPermission('documents.published', 'update')
                                  ? [{ label: 'Rename', onClick: () => openRename('file', doc.id, doc.fileName) }]
                                  : []
                                ),
                                ...(hasPermission('documents.published', 'update') && !['OBSOLETE', 'SUPERSEDED'].includes(doc.status)
                                  ? [
                                      { label: t('obsolete_action'), onClick: () => handleObsolete(doc) },
                                      { label: t('supersede_action'), onClick: () => handleSupersede(doc) }
                                    ]
                                  : []
                                ),
                                ...(hasPermission('documents.published', 'delete')
                                  ? [
                                      ...(isAdmin ? [{ label: 'Delete as Admin', onClick: () => handleDelete(doc), variant: 'destructive' }] : [])
                                    ]
                                  : []
                                )
                              ]}
                            />
                          )}
                          {/* Folder actions are only available in sidebar to prevent accidental deletion */}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {!loading && totalDocuments > 0 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalDocuments}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
              />
            </div>
          )}
        </div>
      </div>

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[50]" />
          <div className="relative z-[60] flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{t('create_new_folder')}</h3>
              </div>
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {createAccessError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {createAccessError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('folder_name_label')}
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={t('enter_folder_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  autoFocus
                  disabled={createAccessLoading}
                />
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-900">Access control</div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access mode</label>
                      <select
                        value={createAccessMode}
                        onChange={(e) => setCreateAccessMode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        disabled={createAccessLoading}
                      >
                        <option value="PUBLIC">Public (default)</option>
                        <option value="RESTRICTED">Restricted</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={Boolean(createInheritPermissions)}
                          onChange={(e) => setCreateInheritPermissions(e.target.checked)}
                          disabled={createAccessLoading || createAccessMode !== 'RESTRICTED'}
                        />
                        Inherit permissions from parent (if no explicit rule)
                      </label>
                    </div>
                  </div>

                  {createAccessMode === 'RESTRICTED' && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">Rules</div>
                        <button
                          type="button"
                          onClick={() => setCreateAccessEntries((prev) => prev.concat([{
                            subjectType: 'USER',
                            subjectId: subjects.users?.[0]?.id || null,
                            label: subjects.users?.[0]?.email || '',
                            canView: true,
                            canCreate: true,
                            canEdit: true,
                            canDelete: true,
                            canDownload: true
                          }]))}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          disabled={createAccessLoading || ((subjects.users || []).length === 0 && (subjects.roles || []).length === 0)}
                        >
                          Add rule
                        </button>
                      </div>
                      <div className="max-h-[280px] overflow-auto divide-y divide-gray-100">
                        {createAccessEntries.length === 0 ? (
                          <div className="px-4 py-4 text-sm text-gray-600">No rules yet. Add at least one rule.</div>
                        ) : createAccessEntries.map((r, idx) => (
                          <div key={`${r.subjectType}-${r.subjectId}-${idx}`} className="px-4 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                            <div className="lg:col-span-4">
                              <select
                                value={`${r.subjectType}:${r.subjectId || ''}`}
                                onChange={(e) => {
                                  const [st, sid] = String(e.target.value).split(':')
                                  const id = sid ? parseInt(sid, 10) : null
                                  const label = st === 'ROLE'
                                    ? (subjects.roles.find((x) => x.id === id)?.displayName || subjects.roles.find((x) => x.id === id)?.name || '')
                                    : (subjects.users.find((x) => x.id === id)?.email || '')
                                  setCreateAccessEntries((prev) => prev.map((x, i) => i === idx ? { ...x, subjectType: st, subjectId: id, label } : x))
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                disabled={createAccessLoading}
                              >
                                <optgroup label="Users">
                                  {(subjects.users || []).map((u) => (
                                    <option key={`U-${u.id}`} value={`USER:${u.id}`}>{u.email}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Roles">
                                  {(subjects.roles || []).map((ro) => (
                                    <option key={`R-${ro.id}`} value={`ROLE:${ro.id}`}>{ro.displayName || ro.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                            <div className="lg:col-span-7 flex flex-wrap gap-3 text-sm text-gray-700">
                              {['View', 'Create', 'Edit', 'Delete', 'Download'].map((label) => {
                                const key = `can${label}`
                                return (
                                  <label key={label} className="inline-flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(r[key])}
                                      onChange={(e) => setCreateAccessEntries((prev) => prev.map((x, i) => i === idx ? { ...x, [key]: e.target.checked } : x))}
                                      disabled={createAccessLoading}
                                    />
                                    {label}
                                  </label>
                                )
                              })}
                            </div>
                            <div className="lg:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setCreateAccessEntries((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                                disabled={createAccessLoading}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setShowCreateFolderModal(false)
                  setNewFolderName('')
                  resetCreateAccess()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={createAccessLoading}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={createAccessLoading}
              >
                {createAccessLoading ? 'Creating...' : t('create')}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Upload File Modal */}
      {showUploadFileModal && (
        <BulkImportModal
          isOpen={showUploadFileModal}
          onClose={() => setShowUploadFileModal(false)}
          onSubmit={handleUploadFile}
          folders={flatFolders.filter((f) => Boolean(f.canCreate))}
          selectedFolderId={selectedFolder}
        />
      )}

      {/* Create Sub Folder Modal */}
      {showCreateSubFolderModal && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-[50]" />
          <div className="relative z-[60] flex min-h-full items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{t('create_new_subfolder')}</h3>
              </div>
              <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
              {createAccessError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  {createAccessError}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('select_parent_folder')}
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <select
                    value={parentFolderForSub ?? ''}
                    onChange={(e) => setParentFolderForSub(toFolderId(e.target.value))}
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm appearance-none bg-white cursor-pointer hover:border-gray-400 transition-colors"
                    style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}
                    disabled={createAccessLoading}
                  >
                    <option value="" className="text-gray-500">{t('select_a_folder')}</option>
                    {flatFolders.filter((f) => Boolean(f.canCreate)).map((folder) => (
                      <option 
                        key={folder.id} 
                        value={toFolderId(folder.id) ?? ''}
                        className="py-2"
                        style={{ 
                          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
                        }}
                      >
                        {folder.icon} {folder.displayName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {parentFolderForSub !== null && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div className="flex-1">
                        <p className="text-xs font-medium text-blue-900">{t('creating_subfolder_in')}</p>
                        <p className="text-xs text-blue-700 mt-0.5 font-mono">
                          {flatFolders.find((f) => toFolderId(f.id) === parentFolderForSub)?.path}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('subfolder_name')}
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder={t('enter_subfolder_name')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-sm font-medium text-gray-900">Access control</div>
                <div className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Access mode</label>
                      <select
                        value={createAccessMode}
                        onChange={(e) => setCreateAccessMode(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        disabled={createAccessLoading}
                      >
                        <option value="PUBLIC">Public (default)</option>
                        <option value="RESTRICTED">Restricted</option>
                      </select>
                    </div>
                    <div className="md:col-span-2 flex items-end">
                      <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                        <input
                          type="checkbox"
                          checked={Boolean(createInheritPermissions)}
                          onChange={(e) => setCreateInheritPermissions(e.target.checked)}
                          disabled={createAccessLoading || createAccessMode !== 'RESTRICTED'}
                        />
                        Inherit permissions from parent (if no explicit rule)
                      </label>
                    </div>
                  </div>

                  {createAccessMode === 'RESTRICTED' && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="px-4 py-2 bg-gray-50 flex items-center justify-between">
                        <div className="text-sm font-medium text-gray-900">Rules</div>
                        <button
                          type="button"
                          onClick={() => setCreateAccessEntries((prev) => prev.concat([{
                            subjectType: 'USER',
                            subjectId: subjects.users?.[0]?.id || null,
                            label: subjects.users?.[0]?.email || '',
                            canView: true,
                            canCreate: true,
                            canEdit: true,
                            canDelete: true,
                            canDownload: true
                          }]))}
                          className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                          disabled={createAccessLoading || ((subjects.users || []).length === 0 && (subjects.roles || []).length === 0)}
                        >
                          Add rule
                        </button>
                      </div>
                      <div className="max-h-[280px] overflow-auto divide-y divide-gray-100">
                        {createAccessEntries.length === 0 ? (
                          <div className="px-4 py-4 text-sm text-gray-600">No rules yet. Add at least one rule.</div>
                        ) : createAccessEntries.map((r, idx) => (
                          <div key={`${r.subjectType}-${r.subjectId}-${idx}`} className="px-4 py-3 grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
                            <div className="lg:col-span-4">
                              <select
                                value={`${r.subjectType}:${r.subjectId || ''}`}
                                onChange={(e) => {
                                  const [st, sid] = String(e.target.value).split(':')
                                  const id = sid ? parseInt(sid, 10) : null
                                  const label = st === 'ROLE'
                                    ? (subjects.roles.find((x) => x.id === id)?.displayName || subjects.roles.find((x) => x.id === id)?.name || '')
                                    : (subjects.users.find((x) => x.id === id)?.email || '')
                                  setCreateAccessEntries((prev) => prev.map((x, i) => i === idx ? { ...x, subjectType: st, subjectId: id, label } : x))
                                }}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
                                disabled={createAccessLoading}
                              >
                                <optgroup label="Users">
                                  {(subjects.users || []).map((u) => (
                                    <option key={`U-${u.id}`} value={`USER:${u.id}`}>{u.email}</option>
                                  ))}
                                </optgroup>
                                <optgroup label="Roles">
                                  {(subjects.roles || []).map((ro) => (
                                    <option key={`R-${ro.id}`} value={`ROLE:${ro.id}`}>{ro.displayName || ro.name}</option>
                                  ))}
                                </optgroup>
                              </select>
                            </div>
                            <div className="lg:col-span-7 flex flex-wrap gap-3 text-sm text-gray-700">
                              {['View', 'Create', 'Edit', 'Delete', 'Download'].map((label) => {
                                const key = `can${label}`
                                return (
                                  <label key={label} className="inline-flex items-center gap-2">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(r[key])}
                                      onChange={(e) => setCreateAccessEntries((prev) => prev.map((x, i) => i === idx ? { ...x, [key]: e.target.checked } : x))}
                                      disabled={createAccessLoading}
                                    />
                                    {label}
                                  </label>
                                )
                              })}
                            </div>
                            <div className="lg:col-span-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setCreateAccessEntries((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-sm text-red-600 hover:text-red-700 font-medium"
                                disabled={createAccessLoading}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
              <button
                onClick={() => {
                  setShowCreateSubFolderModal(false)
                  setNewFolderName('')
                  setParentFolderForSub(null)
                  resetCreateAccess()
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={createAccessLoading}
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleCreateSubFolder}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={createAccessLoading || parentFolderForSub === null || !String(newFolderName || '').trim()}
              >
                {createAccessLoading ? 'Creating...' : t('create')}
              </button>
            </div>
          </div>
        </div>
        </div>
      )}
      
      {/* Document Viewer Modal */}
      {showViewModal && selectedDocument && (
        <DocumentViewerModal
          document={selectedDocument}
          onClose={() => {
            setShowViewModal(false)
            setSelectedDocument(null)
          }}
        />
      )}
      
      {/* Supersede/Obsolete Modal */}
      {showSupersedeObsoleteModal && selectedDocument && (
        <SupersedeObsoleteModal
          isOpen={showSupersedeObsoleteModal}
          document={selectedDocument}
          actionType={actionType}
          onClose={() => {
            setShowSupersedeObsoleteModal(false)
            setSelectedDocument(null)
            setActionType(null)
          }}
          onSubmit={handleSupersedeObsoleteSubmit}
        />
      )}
    </div>
  )
}
