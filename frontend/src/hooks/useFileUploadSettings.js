import { useState, useEffect } from 'react'
import api from '../api/axios'

// MIME type mappings for file extensions
const MIME_TYPE_MAP = {
  PDF: ['application/pdf'],
  DOC: ['application/msword'],
  DOCX: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  DOTX: ['application/vnd.openxmlformats-officedocument.wordprocessingml.template'],
  XLS: ['application/vnd.ms-excel'],
  XLSX: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  XLTX: ['application/vnd.openxmlformats-officedocument.spreadsheetml.template'],
  PPT: ['application/vnd.ms-powerpoint'],
  PPTX: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  TXT: ['text/plain'],
  PNG: ['image/png'],
  JPG: ['image/jpeg', 'image/jpg'],
  JPEG: ['image/jpeg'],
  GIF: ['image/gif'],
  CSV: ['text/csv', 'application/csv'],
  JS: ['text/javascript', 'application/javascript'],
  JSX: ['text/javascript', 'application/javascript'],
  TS: ['application/typescript', 'text/plain'],
  TSX: ['application/typescript', 'text/plain'],
  JSON: ['application/json', 'text/json', 'text/plain'],
  HTML: ['text/html'],
  CSS: ['text/css'],
  SCSS: ['text/x-scss', 'text/plain'],
  LESS: ['text/plain'],
  MD: ['text/markdown', 'text/plain'],
  YML: ['text/yaml', 'application/x-yaml', 'text/plain'],
  YAML: ['text/yaml', 'application/x-yaml', 'text/plain'],
  XML: ['application/xml', 'text/xml', 'text/plain'],
  SQL: ['application/sql', 'text/plain'],
  PY: ['text/x-python', 'text/plain'],
  JAVA: ['text/x-java-source', 'text/plain'],
  C: ['text/x-c', 'text/plain'],
  CPP: ['text/x-c++', 'text/plain'],
  H: ['text/x-c', 'text/plain'],
  HPP: ['text/x-c++', 'text/plain'],
  CS: ['text/plain'],
  GO: ['text/plain'],
  RB: ['text/plain'],
  RS: ['text/plain'],
  KT: ['text/plain'],
  SWIFT: ['text/plain'],
  VUE: ['text/plain']
}

// Extension mappings (lowercase)
const EXTENSION_MAP = {
  PDF: '.pdf',
  DOC: '.doc',
  DOCX: '.docx',
  DOTX: '.dotx',
  XLS: '.xls',
  XLSX: '.xlsx',
  XLTX: '.xltx',
  PPT: '.ppt',
  PPTX: '.pptx',
  TXT: '.txt',
  PNG: '.png',
  JPG: '.jpg',
  JPEG: '.jpeg',
  GIF: '.gif',
  CSV: '.csv',
  JS: '.js',
  JSX: '.jsx',
  TS: '.ts',
  TSX: '.tsx',
  JSON: '.json',
  HTML: '.html',
  CSS: '.css',
  SCSS: '.scss',
  LESS: '.less',
  MD: '.md',
  YML: '.yml',
  YAML: '.yaml',
  XML: '.xml',
  SQL: '.sql',
  PY: '.py',
  JAVA: '.java',
  C: '.c',
  CPP: '.cpp',
  H: '.h',
  HPP: '.hpp',
  CS: '.cs',
  GO: '.go',
  RB: '.rb',
  RS: '.rs',
  KT: '.kt',
  SWIFT: '.swift',
  VUE: '.vue'
}

// Default settings (fallback)
const DEFAULT_SETTINGS = {
  maxFileSize: 10, // MB
  allowedTypes: [
    'PDF', 'DOC', 'DOCX', 'DOTX', 'XLS', 'XLSX', 'XLTX', 'PPT', 'PPTX', 'TXT', 'PNG', 'JPG', 'JPEG', 'GIF', 'CSV',
    'JS', 'JSX', 'TS', 'TSX', 'JSON', 'HTML', 'CSS', 'SCSS', 'LESS', 'MD', 'YML', 'YAML', 'XML', 'SQL',
    'PY', 'JAVA', 'C', 'CPP', 'H', 'HPP', 'CS', 'GO', 'RB', 'RS', 'KT', 'SWIFT', 'VUE'
  ],
  bulkUploadLimit: 10
}

// Cache for settings to avoid multiple API calls
let cachedSettings = null
let cacheTimestamp = 0
const CACHE_DURATION = 60000 // 1 minute

/**
 * Hook to get file upload settings from the backend configuration
 * Provides validation functions and settings data
 */
export default function useFileUploadSettings() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    // Check cache first
    const now = Date.now()
    if (cachedSettings && (now - cacheTimestamp) < CACHE_DURATION) {
      setSettings(cachedSettings)
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/system/config/file-upload')
      if (response.data.success && response.data.data.settings) {
        const loadedSettings = response.data.data.settings
        cachedSettings = loadedSettings
        cacheTimestamp = now
        setSettings(loadedSettings)
      }
    } catch (err) {
      console.error('Failed to load file upload settings:', err)
      setError(err)
      // Use default settings on error
    } finally {
      setLoading(false)
    }
  }

  /**
   * Get allowed MIME types based on configured file types
   */
  const getAllowedMimeTypes = () => {
    const mimeTypes = []
    const allowedTypes = settings.allowedTypes || DEFAULT_SETTINGS.allowedTypes
    
    allowedTypes.forEach(type => {
      const normalizedType = type.toUpperCase()
      if (MIME_TYPE_MAP[normalizedType]) {
        mimeTypes.push(...MIME_TYPE_MAP[normalizedType])
      }
    })
    
    return mimeTypes
  }

  /**
   * Get allowed file extensions for the file input accept attribute
   */
  const getAllowedExtensions = () => {
    const extensions = []
    const allowedTypes = settings.allowedTypes || DEFAULT_SETTINGS.allowedTypes
    
    allowedTypes.forEach(type => {
      const normalizedType = type.toUpperCase()
      if (EXTENSION_MAP[normalizedType]) extensions.push(EXTENSION_MAP[normalizedType])
      else extensions.push(`.${String(type).toLowerCase()}`)
    })
    
    return Array.from(new Set(extensions.filter(Boolean)))
  }

  /**
   * Get accept string for file input
   */
  const getAcceptString = () => {
    return getAllowedExtensions().join(',')
  }

  /**
   * Get human-readable list of allowed file types
   */
  const getAllowedTypesDisplay = () => {
    const allowedTypes = settings.allowedTypes || DEFAULT_SETTINGS.allowedTypes
    return allowedTypes.map(t => `.${t.toLowerCase()}`).join(', ')
  }

  /**
   * Validate file type against allowed types
   * @param {File} file - The file to validate
   * @returns {{ valid: boolean, error: string | null }}
   */
  const validateFileType = (file) => {
    const allowedMimeTypes = getAllowedMimeTypes()
    const allowedExtensions = getAllowedExtensions()
    
    // Check by MIME type
    if (allowedMimeTypes.includes(file.type)) {
      return { valid: true, error: null }
    }
    
    // Fallback: check by extension
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if (hasValidExtension) {
      return { valid: true, error: null }
    }
    
    return {
      valid: false,
      error: `Invalid file type. Only ${getAllowedTypesDisplay()} files are allowed`
    }
  }

  /**
   * Validate file size against max file size setting
   * @param {File} file - The file to validate
   * @returns {{ valid: boolean, error: string | null }}
   */
  const validateFileSize = (file) => {
    const maxSizeBytes = (settings.maxFileSize || DEFAULT_SETTINGS.maxFileSize) * 1024 * 1024
    
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds the maximum allowed size of ${settings.maxFileSize || DEFAULT_SETTINGS.maxFileSize} MB`
      }
    }
    
    return { valid: true, error: null }
  }

  /**
   * Validate a file against all settings (type and size)
   * @param {File} file - The file to validate
   * @returns {{ valid: boolean, error: string | null }}
   */
  const validateFile = (file) => {
    // Validate type first
    const typeValidation = validateFileType(file)
    if (!typeValidation.valid) {
      return typeValidation
    }
    
    // Then validate size
    const sizeValidation = validateFileSize(file)
    if (!sizeValidation.valid) {
      return sizeValidation
    }
    
    return { valid: true, error: null }
  }

  /**
   * Force refresh settings from backend
   */
  const refreshSettings = async () => {
    cachedSettings = null
    cacheTimestamp = 0
    setLoading(true)
    await loadSettings()
  }

  return {
    settings,
    loading,
    error,
    validateFile,
    validateFileType,
    validateFileSize,
    getAllowedMimeTypes,
    getAllowedExtensions,
    getAcceptString,
    getAllowedTypesDisplay,
    refreshSettings,
    maxFileSize: settings.maxFileSize || DEFAULT_SETTINGS.maxFileSize,
    bulkUploadLimit: settings.bulkUploadLimit || DEFAULT_SETTINGS.bulkUploadLimit
  }
}

/**
 * Utility function to validate a file without using the hook
 * Useful for one-off validations or in non-component code
 * Uses cached settings if available, otherwise uses defaults
 */
export async function validateFileUpload(file) {
  let settingsToUse = DEFAULT_SETTINGS
  
  // Try to use cached settings
  if (cachedSettings) {
    settingsToUse = cachedSettings
  } else {
    // Try to fetch settings
    try {
      const response = await api.get('/system/config/file-upload')
      if (response.data.success && response.data.data.settings) {
        settingsToUse = response.data.data.settings
        cachedSettings = settingsToUse
        cacheTimestamp = Date.now()
      }
    } catch (err) {
      console.error('Failed to load file upload settings:', err)
    }
  }

  // Validate MIME type
  const allowedTypes = settingsToUse.allowedTypes || DEFAULT_SETTINGS.allowedTypes
  const mimeTypes = []
  allowedTypes.forEach(type => {
    const normalizedType = type.toUpperCase()
    if (MIME_TYPE_MAP[normalizedType]) {
      mimeTypes.push(...MIME_TYPE_MAP[normalizedType])
    }
  })

  if (!mimeTypes.includes(file.type)) {
    // Fallback: check extension
    const extensions = allowedTypes.map(t => `.${t.toLowerCase()}`)
    const fileName = file.name.toLowerCase()
    const hasValidExtension = extensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Invalid file type. Only ${allowedTypes.map(t => `.${t.toLowerCase()}`).join(', ')} files are allowed`
      }
    }
  }

  // Validate size
  const maxSizeBytes = (settingsToUse.maxFileSize || DEFAULT_SETTINGS.maxFileSize) * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds the maximum allowed size of ${settingsToUse.maxFileSize || DEFAULT_SETTINGS.maxFileSize} MB`
    }
  }

  return { valid: true, error: null }
}
