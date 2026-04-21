const prisma = require('../src/config/database')

function getArg(name) {
  const idx = process.argv.indexOf(name)
  if (idx === -1) return null
  return process.argv[idx + 1] || null
}

function parseBool(value, fallback) {
  if (value === null || value === undefined) return fallback
  const v = String(value).toLowerCase().trim()
  if (v === 'true' || v === '1' || v === 'yes' || v === 'y') return true
  if (v === 'false' || v === '0' || v === 'no' || v === 'n') return false
  return fallback
}

async function main() {
  const enable2FA = parseBool(getArg('--enable2fa'), false)
  const email = parseBool(getArg('--email'), true)
  const app = parseBool(getArg('--app'), false)

  const config = await prisma.configuration.findUnique({
    where: { key: 'security_settings' }
  })

  let current = {}
  if (config?.value) {
    try {
      current = JSON.parse(config.value) || {}
    } catch {}
  }

  const next = {
    ...current,
    enable2FA,
    twoFAMethods: {
      email,
      app
    }
  }

  await prisma.configuration.upsert({
    where: { key: 'security_settings' },
    update: { value: JSON.stringify(next) },
    create: { key: 'security_settings', value: JSON.stringify(next) }
  })

  process.stdout.write('OK\\n')
  process.stdout.write(`enable2FA=${String(enable2FA)}\\n`)
  process.stdout.write(`twoFAMethods.email=${String(email)}\\n`)
  process.stdout.write(`twoFAMethods.app=${String(app)}\\n`)
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

