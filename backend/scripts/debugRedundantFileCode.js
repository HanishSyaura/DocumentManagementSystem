const prisma = require('../src/config/database')
const DocumentNumbering = require('../src/utils/documentNumbering')
const documentService = require('../src/services/documentService')

async function main() {
  const rawFileCode = process.argv[2] || ''
  const projectCategoryName = process.argv[3] || ''
  const docTypePrefix = process.argv[4] || ''

  if (!rawFileCode || !projectCategoryName || !docTypePrefix) {
    process.stdout.write('Usage: node scripts/debugRedundantFileCode.js <rawFileCode> <projectCategoryName> <docTypePrefix>\\n')
    process.exitCode = 2
    return
  }

  const settings = await DocumentNumbering.loadSettings()
  const parsed = documentService.parseAndNormalizeFileCodeStrict(String(rawFileCode).trim(), settings)

  const pc = await prisma.projectCategory.findFirst({
    where: { name: { equals: String(projectCategoryName) } },
    select: { id: true, name: true }
  })
  const dt = await prisma.documentType.findFirst({
    where: { prefix: { equals: String(docTypePrefix).toUpperCase() } },
    select: { id: true, prefix: true, name: true }
  })

  const base = { pc, dt, parsed }
  if (!pc || !dt) {
    process.stdout.write(JSON.stringify(base, null, 2) + '\\n')
    return
  }

  const normalized = parsed.normalizedFileCode
  const codeKey = documentService.buildCodeKey(pc.id, dt.id)

  const [docExact, regExact, regRunning] = await Promise.all([
    prisma.document.findFirst({
      where: { projectCategoryId: pc.id, fileCode: normalized },
      select: { id: true, fileCode: true, status: true, documentTypeId: true }
    }),
    prisma.codeRegistry.findFirst({
      where: { projectCategoryId: pc.id, fileCode: normalized },
      select: { id: true, fileCode: true, codeKey: true, runningNumber: true, source: true, sourceRefId: true, createdAt: true }
    }),
    prisma.codeRegistry.findFirst({
      where: { projectCategoryId: pc.id, codeKey, runningNumber: parsed.runningNumber },
      select: { id: true, fileCode: true, codeKey: true, runningNumber: true, source: true, sourceRefId: true, createdAt: true }
    })
  ])

  let otherDoc = null
  if (regRunning && regRunning.fileCode !== normalized) {
    otherDoc = await prisma.document.findFirst({
      where: { projectCategoryId: pc.id, fileCode: regRunning.fileCode },
      select: { id: true, fileCode: true, status: true, documentTypeId: true }
    })
  }

  process.stdout.write(JSON.stringify({ ...base, normalized, codeKey, docExact, regExact, regRunning, otherDoc }, null, 2) + '\\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (err) => {
    process.stderr.write(String(err?.stack || err) + '\\n')
    try {
      await prisma.$disconnect()
    } catch {
    }
    process.exitCode = 1
  })
