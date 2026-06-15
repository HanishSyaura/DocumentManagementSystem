const ResponseFormatter = require('../utils/responseFormatter')
const asyncHandler = require('../utils/asyncHandler')
const epcRegistryService = require('../services/epcRegistryService')

class EpcRegistryController {
  getStatus = asyncHandler(async (_req, res) => {
    const enabled = await epcRegistryService.isEnabled()
    return ResponseFormatter.success(res, { enabled }, 'EPC registry status retrieved successfully')
  })

  listRecords = asyncHandler(async (req, res) => {
    const data = await epcRegistryService.listRecords(req.query)
    return ResponseFormatter.success(res, data, 'EPC registry records retrieved successfully')
  })

  exportRecords = asyncHandler(async (req, res) => {
    const { csv } = await epcRegistryService.exportRecords(req.query)
    const fileName = `epc_registry_${new Date().toISOString().split('T')[0]}.csv`
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`)
    return res.status(200).send(csv)
  })
}

module.exports = new EpcRegistryController()
