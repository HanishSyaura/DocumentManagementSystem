const prisma = require('../config/database')
const configService = require('./configService')
const auditLogService = require('./auditLogService')
const { fileCodeToFixedEpcHex, FIXED_EPC_HEX_LENGTH } = require('../utils/epcEncoder')

class EpcRegistryService {
  getDefaultSettings() {
    return {
      enabled: false
    }
  }

  async getSettings() {
    const cfg = await configService.getRfidEpcRegistrySettings()
    return {
      ...this.getDefaultSettings(),
      ...(cfg && typeof cfg === 'object' ? cfg : {})
    }
  }

  async isEnabled() {
    const settings = await this.getSettings()
    return Boolean(settings.enabled)
  }

  buildCsv(records) {
    const escape = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const rows = [
      [
        'Generated At',
        'File Code',
        'File Name',
        'EPC Hex',
        'Scheme',
        'Document Title',
        'Document Type',
        'Version'
      ].join(',')
    ]

    for (const record of records) {
      rows.push([
        escape(record.generatedAt ? new Date(record.generatedAt).toISOString() : ''),
        escape(record.fileCode),
        escape(record.fileName),
        escape(record.epcHex),
        escape(record.epcScheme),
        escape(record.document?.title || ''),
        escape(record.document?.documentType?.name || ''),
        escape(record.document?.version || '')
      ].join(','))
    }

    return rows.join('\n')
  }

  async generateForUploadedDraft(documentId, documentVersionId, req = null) {
    const enabled = await this.isEnabled()
    if (!enabled) return null

    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        documentType: true,
        versions: {
          where: { id: documentVersionId },
          take: 1
        }
      }
    })

    if (!document || !document.versions?.length) return null

    const version = document.versions[0]
    const epcHex = fileCodeToFixedEpcHex(document.fileCode)
    const payload = {
      documentId,
      documentVersionId,
      fileCode: document.fileCode,
      fileName: version.fileName,
      epcScheme: 'FILECODE-HASH-96',
      epcHex,
      filter: 0,
      companyPrefixDigits: 0,
      companyPrefix: 'FIXED96',
      itemReference: document.fileCode,
      serial: String(document.id),
      tagUri: `urn:dms:epc:${epcHex}`,
      pureIdentityUri: `urn:dms:file-code:${encodeURIComponent(document.fileCode)}`,
      generatedAt: new Date()
    }

    const duplicate = await prisma.documentEpcRegistryRecord.findUnique({
      where: { epcHex }
    })

    let record = null
    if (duplicate) {
      if (duplicate.documentId !== documentId) {
        throw new Error(`EPC hex yang sama sudah digunakan oleh file code lain: ${duplicate.fileCode}`)
      }

      record = await prisma.documentEpcRegistryRecord.update({
        where: { id: duplicate.id },
        data: payload
      })
    } else {
      const existingForDocument = await prisma.documentEpcRegistryRecord.findFirst({
        where: { documentId }
      })

      if (existingForDocument) {
        record = await prisma.documentEpcRegistryRecord.update({
          where: { id: existingForDocument.id },
          data: payload
        })
      } else {
        record = await prisma.documentEpcRegistryRecord.create({
          data: payload
        })
      }
    }

    await auditLogService.logDocument(req?.user?.id || null, 'EPC_GENERATE', {
      id: document.id,
      fileCode: document.fileCode
    }, req, {
      documentVersionId,
      epcHex: record.epcHex,
      epcScheme: record.epcScheme,
      generationMode: 'fixed-96-bit-hash-from-file-code',
      epcHexLength: FIXED_EPC_HEX_LENGTH,
      fileName: record.fileName
    })

    return record
  }

  async listRecords(filters = {}) {
    const enabled = await this.isEnabled()
    const page = Math.max(parseInt(filters.page, 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(filters.limit, 10) || 20, 1), 200)
    const skip = (page - 1) * limit

    const where = {}
    if (filters.fileCode) {
      where.fileCode = { contains: String(filters.fileCode).trim() }
    }

    if (filters.from || filters.to) {
      where.generatedAt = {}
      if (filters.from) {
        where.generatedAt.gte = new Date(`${filters.from}T00:00:00.000Z`)
      }
      if (filters.to) {
        where.generatedAt.lte = new Date(`${filters.to}T23:59:59.999Z`)
      }
    }

    const [records, total] = await Promise.all([
      prisma.documentEpcRegistryRecord.findMany({
        where,
        include: {
          document: {
            select: {
              id: true,
              title: true,
              version: true,
              documentType: {
                select: { name: true }
              }
            }
          }
        },
        orderBy: { generatedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.documentEpcRegistryRecord.count({ where })
    ])

    return {
      enabled,
      page,
      limit,
      total,
      records
    }
  }

  async exportRecords(filters = {}) {
    const enabled = await this.isEnabled()
    const where = {}
    if (filters.fileCode) {
      where.fileCode = { contains: String(filters.fileCode).trim() }
    }
    if (filters.from || filters.to) {
      where.generatedAt = {}
      if (filters.from) where.generatedAt.gte = new Date(`${filters.from}T00:00:00.000Z`)
      if (filters.to) where.generatedAt.lte = new Date(`${filters.to}T23:59:59.999Z`)
    }

    const records = await prisma.documentEpcRegistryRecord.findMany({
      where,
      include: {
        document: {
          select: {
            title: true,
            version: true,
            documentType: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    })

    return {
      enabled,
      csv: this.buildCsv(records),
      count: records.length
    }
  }
}

module.exports = new EpcRegistryService()
