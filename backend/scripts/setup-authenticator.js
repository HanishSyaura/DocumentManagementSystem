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

async function main() {
  const email = getArg('--email')
  const issuer = getArg('--issuer') || 'FileNix / DMS'
  const qrOut = getArg('--qr-out')

  if (!email) {
    process.stderr.write('Usage: node scripts/setup-authenticator.js --email <user@email> [--issuer "FileNix / DMS"] [--qr-out /path/to/qr.png]\\n')
    process.exit(1)
  }

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true }
  })

  if (!user) {
    process.stderr.write(`User not found: ${email}\\n`)
    process.exit(1)
  }

  const secret = speakeasy.generateSecret({
    name: `${issuer}:${user.email}`,
    issuer
  })

  const encryptedSecret = encryptionService.encryptString(secret.base32)

  await prisma.user.update({
    where: { id: user.id },
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

  let mergedSecurity = { enable2FA: true, twoFAMethods: { email: true, app: true } }
  if (securityConfig?.value) {
    try {
      const parsed = JSON.parse(securityConfig.value)
      const twoFAMethods = parsed?.twoFAMethods && typeof parsed.twoFAMethods === 'object' ? parsed.twoFAMethods : {}
      mergedSecurity = {
        ...parsed,
        enable2FA: parsed?.enable2FA ?? true,
        twoFAMethods: {
          email: twoFAMethods.email ?? true,
          app: true
        }
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
    const fileName = `otp-${sanitizeFileName(user.email)}.png`
    await qrcode.toFile(fileName, secret.otpauth_url)
    process.stdout.write(`qrFile=${fileName}\\n`)
  }

  process.stdout.write('OK\\n')
  process.stdout.write(`email=${user.email}\\n`)
  process.stdout.write(`issuer=${issuer}\\n`)
  process.stdout.write(`manualKey=${secret.base32}\\n`)
  process.stdout.write(`otpauthUrl=${secret.otpauth_url}\\n`)
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

