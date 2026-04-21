const speakeasy = require('speakeasy')
const qrcode = require('qrcode')
const prisma = require('../src/config/database')
const encryptionService = require('../src/services/encryptionService')

function getArg(name) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

function sanitizeFileName(input) {
  return String(input).replace(/[^a-zA-Z0-9._-]/g, '_')
}

async function resolveAdminUser(fromEmail) {
  if (fromEmail) {
    const byEmail = await prisma.user.findUnique({
      where: { email: fromEmail },
      select: { id: true, email: true }
    })
    if (byEmail) return byEmail
  }

  const adminRole = await prisma.role.findUnique({
    where: { name: 'admin' },
    select: { id: true }
  })
  if (!adminRole) return null

  const adminUserRole = await prisma.userRole.findFirst({
    where: { roleId: adminRole.id },
    select: { userId: true }
  })
  if (!adminUserRole) return null

  return prisma.user.findUnique({
    where: { id: adminUserRole.userId },
    select: { id: true, email: true }
  })
}

async function main() {
  const toEmail = getArg('--to-email')
  const fromEmail = getArg('--from-email')
  const issuer = getArg('--issuer') || 'FileNix / DMS'
  const qrOut = getArg('--qr-out')

  if (!toEmail) {
    process.stderr.write('Usage: node scripts/admin-recovery-2fa.js --to-email <new_admin@email> [--from-email <current@email>] [--issuer "FileNix / DMS"] [--qr-out /path/to/qr.png]\\n')
    process.exit(1)
  }

  const existingTarget = await prisma.user.findUnique({
    where: { email: toEmail },
    select: { id: true }
  })
  if (existingTarget) {
    process.stderr.write(`Target email already exists: ${toEmail}\\n`)
    process.exit(1)
  }

  const adminUser = await resolveAdminUser(fromEmail || null)
  if (!adminUser) {
    process.stderr.write('Admin user not found (by --from-email or admin role).\\n')
    process.exit(1)
  }

  const updatedAdmin = await prisma.user.update({
    where: { id: adminUser.id },
    data: {
      email: toEmail,
      status: 'ACTIVE',
      failedAttempts: 0,
      lockedUntil: null
    },
    select: { id: true, email: true }
  })

  const secret = speakeasy.generateSecret({
    name: `${issuer}:${updatedAdmin.email}`,
    issuer
  })

  const encryptedSecret = encryptionService.encryptString(secret.base32)

  await prisma.user.update({
    where: { id: updatedAdmin.id },
    data: {
      twoFactorEnabled: true,
      twoFactorMethod: 'app',
      twoFactorSecret: encryptedSecret,
      twoFactorTempSecret: null,
      twoFactorCode: null,
      twoFactorCodeExpiry: null
    }
  })

  const securityConfig = await prisma.configuration.findUnique({
    where: { key: 'security_settings' }
  })

  let mergedSecurity = { enable2FA: true, twoFAMethods: { email: false, app: true } }
  if (securityConfig?.value) {
    try {
      const parsed = JSON.parse(securityConfig.value)
      mergedSecurity = {
        ...(parsed && typeof parsed === 'object' ? parsed : {}),
        enable2FA: true,
        twoFAMethods: { email: false, app: true }
      }
    } catch {}
  }

  await prisma.configuration.upsert({
    where: { key: 'security_settings' },
    update: { value: JSON.stringify(mergedSecurity) },
    create: { key: 'security_settings', value: JSON.stringify(mergedSecurity) }
  })

  if (qrOut) {
    await qrcode.toFile(qrOut, secret.otpauth_url)
  } else {
    const fileName = `otp-${sanitizeFileName(updatedAdmin.email)}.png`
    await qrcode.toFile(fileName, secret.otpauth_url)
    process.stdout.write(`qrFile=${fileName}\\n`)
  }

  process.stdout.write('OK\\n')
  process.stdout.write(`email=${updatedAdmin.email}\\n`)
  process.stdout.write(`issuer=${issuer}\\n`)
  process.stdout.write(`manualKey=${secret.base32}\\n`)
  process.stdout.write(`otpauthUrl=${secret.otpauth_url}\\n`)
  process.stdout.write('2FA(system)=enabled, methods=app-only\\n')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    process.stderr.write(String(e && e.stack ? e.stack : e) + '\\n')
    try { await prisma.$disconnect() } catch {}
    process.exit(1)
  })

