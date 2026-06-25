const asyncHandler = require('../utils/asyncHandler')
const ResponseFormatter = require('../utils/responseFormatter')
const expiryTrackingService = require('../services/expiryTrackingService')

exports.listProfiles = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query
  const result = await expiryTrackingService.listProfiles(filters, { page, limit })

  return ResponseFormatter.success(
    res,
    {
      records: result.records,
      pagination: result.pagination
    },
    'Expiry tracking records retrieved successfully'
  )
})

exports.getDashboard = asyncHandler(async (req, res) => {
  const dashboard = await expiryTrackingService.getDashboard(req.query)
  return ResponseFormatter.success(res, { dashboard }, 'Expiry dashboard retrieved successfully')
})

exports.getProfile = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.getProfile(req.params.documentId)
  return ResponseFormatter.success(res, { profile }, 'Expiry profile retrieved successfully')
})

exports.getWatchers = asyncHandler(async (req, res) => {
  const data = await expiryTrackingService.listWatchers(req.params.documentId)
  return ResponseFormatter.success(res, data, 'Expiry watchers retrieved successfully')
})

exports.updateWatchers = asyncHandler(async (req, res) => {
  const watcherIds = req.body?.watcherIds
  const profile = await expiryTrackingService.updateWatchers(req.params.documentId, watcherIds, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Expiry watchers updated successfully')
})

exports.syncFromDocument = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.syncProfileFromDocument(req.params.documentId, req.body || {}, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Expiry profile synced successfully')
})

exports.updateProfile = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.updateProfile(req.params.documentId, req.body || {}, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Expiry profile updated successfully')
})

exports.startRenewal = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.startRenewal(req.params.documentId, req.body || {}, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Renewal started successfully')
})

exports.rejectRenewal = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.rejectRenewal(req.params.documentId, req.body || {}, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Renewal rejected successfully')
})

exports.completeRenewal = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.completeRenewal(req.params.documentId, req.file, req.body || {}, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Renewal completed successfully')
})

exports.disableTracking = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.setTrackingEnabled(req.params.documentId, false, req.body || {}, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Expiry tracking disabled successfully')
})

exports.enableTracking = asyncHandler(async (req, res) => {
  const profile = await expiryTrackingService.setTrackingEnabled(req.params.documentId, true, req.body || {}, req.user.id)
  return ResponseFormatter.success(res, { profile }, 'Expiry tracking enabled successfully')
})

exports.exportRecords = asyncHandler(async (req, res) => {
  const records = await expiryTrackingService.exportRecords(req.query || {})
  return ResponseFormatter.success(res, { records }, 'Expiry export data retrieved successfully')
})
