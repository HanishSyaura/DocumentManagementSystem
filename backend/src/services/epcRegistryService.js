const prisma = require('../config/database')
const configService = require('./configService')
const auditLogService = require('./auditLogService')
const DocumentNumbering = require('../utils/documentNumbering')
const { encodeSgtin96, getSgtinPartition, MAX_SGTIN_SERIAL } = require('../utils/epcEncoder')

class EpcRegistryService {
  getDefaultSettings() {
    return {
      enabled: false,
      companyPrefixDigits: 7,
      companyPrefix: '9551234',
      filter: 1,
      itemReferenceByDocumentType: {}
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

  getItemReference(documentTypeId, itemReferenceDigits, settings) {
    const map = settings?.itemReferenceByDocumentType
    const configured = map && typeof map === 'object' ? map[String(documentTypeId)] : null
    if (configured && /^\d+$/.test(String(configured))) {
      return String(configured).padStart(itemReferenceDigits, '0').slice(-itemReferenceDigits)
    }

    // MVP fallback so the module works without extra admin setup.
    return String(documentTypeId).padStart(itemReferenceDigits, '0').slice(-itemReferenceDigits)
  }

  async deriveSerial(fileCode, documentVersionId) {
    try {
      const numberingSettings = await DocumentNumbering.loadSettings()
      const parsed = await DocumentNumbering.parseFileCode(fileCode, numberingSettings)
      const datePart = String(parsed?.date || '').replace(/\D/g, '')
      const sequenceText = Number.isFinite(parsed?.sequence) ? String(parsed.sequence) : ''
      const counterDigits = parseInt(numberingSettings.counterDigits, 10) || 3

      if (datePart && sequenceText) {
        const serial = (BigInt(datePart) * (10n ** BigInt(counterDigits))) + BigInt(sequenceText)
        if (serial <= MAX_SGTIN_SERIAL) return serial.toString()
      }
    } catch {}

    return String(documentVersionId)
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

    const existing = await prisma.documentEpcRegistryRecord.findUnique({
      where: { documentVersionId }
    })
    if (existing) return existing

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
    const settings = await this.getSettings()
    const partition = getSgtinPartition(settings.companyPrefixDigits)
    const itemReference = this.getItemReference(document.documentTypeId, partition.itemReferenceDigits, settings)
    let serial = await this.deriveSerial(document.fileCode, documentVersionId)

    let encoded = encodeSgtin96({
      filter: settings.filter,
      companyPrefixDigits: settings.companyPrefixDigits,
      companyPrefix: settings.companyPrefix,
      itemReference,
      serial
    })

    const duplicate = await prisma.documentEpcRegistryRecord.findUnique({
      where: { epcHex: encoded.hex }
    })

    if (duplicate) {
      serial = String((BigInt(serial) * 1000n) + BigInt(documentVersionId))
      encoded = encodeSgtin96({
        filter: settings.filter,
        companyPrefixDigits: settings.companyPrefixDigits,
        companyPrefix: settings.companyPrefix,
        itemReference,
        serial
      })
    }

    const record = await prisma.documentEpcRegistryRecord.create({
      data: {
        documentId,
        documentVersionId,
        fileCode: document.fileCode,
        fileName: version.fileName,
        epcScheme: encoded.scheme,
        epcHex: encoded.hex,
        filter: encoded.filter,
        companyPrefixDigits: encoded.companyPrefixDigits,
        companyPrefix: encoded.companyPrefix,
        itemReference: encoded.itemReference,
        serial: encoded.serial,
        tagUri: encoded.tagUri,
        pureIdentityUri: encoded.pureIdentityUri,
        generatedAt: new Date()
      }
    })

    await auditLogService.logDocument(req?.user?.id || null, 'EPC_GENERATE', {
      id: document.id,
      fileCode: document.fileCode
    }, req, {
      documentVersionId,
      epcHex: record.epcHex,
      epcScheme: record.epcScheme,
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
