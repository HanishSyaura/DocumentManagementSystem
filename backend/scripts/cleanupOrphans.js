const prisma = require('../src/config/database')

function hasFlag(name) {
  return process.argv.includes(name)
}

function getArgValue(name) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

function chunk(arr, size) {
  const out = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function main() {
  const apply = hasFlag('--apply')
  const includeCodeRegistry = hasFlag('--include-code-registry')
  const includeAuditLogs = hasFlag('--include-audit-logs')
  const limit = Math.max(0, parseInt(getArgValue('--limit') || '0', 10) || 0)

  const docs = await prisma.document.findMany({
    select: { id: true, fileCode: true, projectCategoryId: true }
  })

  const docIdSet = new Set(docs.map(d => d.id))
  const docFileCodeSet = new Set(docs.map(d => String(d.fileCode || '').trim()).filter(Boolean))
  const docPairSet = new Set(
    docs
      .map(d => `${String(d.fileCode || '').trim()}||${(d.projectCategoryId ?? null) === null ? 'null' : String(d.projectCategoryId)}`)
      .filter(k => !k.startsWith('||'))
  )

  const report = {
    dryRun: !apply,
    documents: docs.length,
    deletes: {}
  }

  const docRegisters = await prisma.documentRegister.findMany({
    select: { id: true, fileCode: true, projectCategoryId: true }
  })
  const orphanDocRegisterIds = docRegisters
    .filter(r => !docPairSet.has(`${String(r.fileCode || '').trim()}||${(r.projectCategoryId ?? null) === null ? 'null' : String(r.projectCategoryId)}`))
    .map(r => r.id)
  report.deletes.documentRegister = orphanDocRegisterIds.length

  const archiveRegs = await prisma.archiveRegister.findMany({ select: { id: true, fileCode: true } })
  const orphanArchiveIds = archiveRegs.filter(r => !docFileCodeSet.has(String(r.fileCode || '').trim())).map(r => r.id)
  report.deletes.archiveRegister = orphanArchiveIds.length

  const obsoleteRegs = await prisma.obsoleteRegister.findMany({ select: { id: true, fileCode: true } })
  const orphanObsoleteIds = obsoleteRegs.filter(r => !docFileCodeSet.has(String(r.fileCode || '').trim())).map(r => r.id)
  report.deletes.obsoleteRegister = orphanObsoleteIds.length

  const versionRegs = await prisma.versionRegister.findMany({ select: { id: true, fileCode: true } })
  const orphanVersionRegIds = versionRegs.filter(r => !docFileCodeSet.has(String(r.fileCode || '').trim())).map(r => r.id)
  report.deletes.versionRegister = orphanVersionRegIds.length

  let orphanCodeRegistryIds = []
  if (includeCodeRegistry) {
    const codeRegs = await prisma.codeRegistry.findMany({ select: { id: true, fileCode: true, projectCategoryId: true } })
    orphanCodeRegistryIds = codeRegs
      .filter(r => !docPairSet.has(`${String(r.fileCode || '').trim()}||${String(r.projectCategoryId)}`))
      .map(r => r.id)
    report.deletes.codeRegistry = orphanCodeRegistryIds.length
  }

  const docVersions = await prisma.documentVersion.findMany({ select: { id: true, documentId: true } })
  const orphanDocumentVersionIds = docVersions.filter(v => !docIdSet.has(v.documentId)).map(v => v.id)
  report.deletes.documentVersion = orphanDocumentVersionIds.length

  const assignments = await prisma.documentAssignment.findMany({ select: { id: true, documentId: true } })
  const orphanAssignmentIds = assignments.filter(a => !docIdSet.has(a.documentId)).map(a => a.id)
  report.deletes.documentAssignment = orphanAssignmentIds.length

  const comments = await prisma.documentComment.findMany({ select: { id: true, documentId: true } })
  const orphanCommentIds = comments.filter(c => !docIdSet.has(c.documentId)).map(c => c.id)
  report.deletes.documentComment = orphanCommentIds.length

  const metadata = await prisma.documentMetadata.findMany({ select: { id: true, documentId: true } })
  const orphanMetadataIds = metadata.filter(m => !docIdSet.has(m.documentId)).map(m => m.id)
  report.deletes.documentMetadata = orphanMetadataIds.length

  const history = await prisma.approvalHistory.findMany({ select: { id: true, documentId: true } })
  const orphanHistoryIds = history.filter(h => !docIdSet.has(h.documentId)).map(h => h.id)
  report.deletes.approvalHistory = orphanHistoryIds.length

  const supersedeReq = await prisma.supersedeObsoleteRequest.findMany({ select: { id: true, documentId: true } })
  const orphanSupersedeIds = supersedeReq.filter(r => !docIdSet.has(r.documentId)).map(r => r.id)
  report.deletes.supersedeObsoleteRequest = orphanSupersedeIds.length

  const versionReq = await prisma.versionRequest.findMany({ select: { id: true, documentId: true } })
  const orphanVersionReqIds = versionReq.filter(r => !docIdSet.has(r.documentId)).map(r => r.id)
  report.deletes.versionRequest = orphanVersionReqIds.length

  let orphanAuditLogIds = []
  if (includeAuditLogs) {
    const audit = await prisma.auditLog.findMany({ select: { id: true, entity: true, entityId: true } })
    orphanAuditLogIds = audit
      .filter(a => String(a.entity || '').toLowerCase() === 'document' && a.entityId != null && !docIdSet.has(a.entityId))
      .map(a => a.id)
    report.deletes.auditLog = orphanAuditLogIds.length
  }

  const cut = (arr) => (limit > 0 ? arr.slice(0, limit) : arr)
  const preview = {
    documentRegisterIds: cut(orphanDocRegisterIds),
    archiveRegisterIds: cut(orphanArchiveIds),
    obsoleteRegisterIds: cut(orphanObsoleteIds),
    versionRegisterIds: cut(orphanVersionRegIds),
    codeRegistryIds: cut(orphanCodeRegistryIds),
    documentVersionIds: cut(orphanDocumentVersionIds),
    documentAssignmentIds: cut(orphanAssignmentIds),
    documentCommentIds: cut(orphanCommentIds),
    documentMetadataIds: cut(orphanMetadataIds),
    approvalHistoryIds: cut(orphanHistoryIds),
    supersedeObsoleteRequestIds: cut(orphanSupersedeIds),
    versionRequestIds: cut(orphanVersionReqIds),
    auditLogIds: cut(orphanAuditLogIds)
  }

  process.stdout.write(JSON.stringify({ report, preview }, null, 2) + '\n')

  if (!apply) return

  await prisma.$transaction(async (tx) => {
    for (const ids of chunk(orphanDocRegisterIds, 500)) {
      if (ids.length) await tx.documentRegister.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanArchiveIds, 500)) {
      if (ids.length) await tx.archiveRegister.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanObsoleteIds, 500)) {
      if (ids.length) await tx.obsoleteRegister.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanVersionRegIds, 500)) {
      if (ids.length) await tx.versionRegister.deleteMany({ where: { id: { in: ids } } })
    }
    if (includeCodeRegistry) {
      for (const ids of chunk(orphanCodeRegistryIds, 500)) {
        if (ids.length) await tx.codeRegistry.deleteMany({ where: { id: { in: ids } } })
      }
    }
    for (const ids of chunk(orphanDocumentVersionIds, 500)) {
      if (ids.length) await tx.documentVersion.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanAssignmentIds, 500)) {
      if (ids.length) await tx.documentAssignment.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanCommentIds, 500)) {
      if (ids.length) await tx.documentComment.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanMetadataIds, 500)) {
      if (ids.length) await tx.documentMetadata.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanHistoryIds, 500)) {
      if (ids.length) await tx.approvalHistory.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanSupersedeIds, 500)) {
      if (ids.length) await tx.supersedeObsoleteRequest.deleteMany({ where: { id: { in: ids } } })
    }
    for (const ids of chunk(orphanVersionReqIds, 500)) {
      if (ids.length) await tx.versionRequest.deleteMany({ where: { id: { in: ids } } })
    }
    if (includeAuditLogs) {
      for (const ids of chunk(orphanAuditLogIds, 500)) {
        if (ids.length) await tx.auditLog.deleteMany({ where: { id: { in: ids } } })
      }
    }
  })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (err) => {
    process.stderr.write(String(err?.stack || err) + '\n')
    try {
      await prisma.$disconnect()
    } catch {
    }
    process.exitCode = 1
  })
