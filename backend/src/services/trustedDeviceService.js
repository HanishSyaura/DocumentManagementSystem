const crypto = require('crypto')
const prisma = require('../config/database')

function parseCookies(cookieHeader) {
  const out = {}
  if (!cookieHeader) return out
  const parts = String(cookieHeader).split(';')
  for (const part of parts) {
    const idx = part.indexOf('=')
    if (idx === -1) continue
    const k = part.slice(0, idx).trim()
    const v = part.slice(idx + 1).trim()
    if (!k) continue
    out[k] = decodeURIComponent(v)
  }
  return out
}

class TrustedDeviceService {
  cookieName = 'td'

  getTrustedToken(req) {
    const cookies = parseCookies(req.headers?.cookie)
    return cookies[this.cookieName] || null
  }

  hashToken(token) {
    return crypto.createHash('sha256').update(String(token)).digest('hex')
  }

  async verifyTrustedDevice(userId, token) {
    if (!token) return false
    const tokenHash = this.hashToken(token)
    const record = await prisma.trustedDevice.findFirst({
      where: {
        userId,
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      select: { id: true }
    })

    if (!record) return false

    await prisma.trustedDevice.update({
      where: { id: record.id },
      data: {
        lastUsedAt: new Date()
      }
    })

    return true
  }

  async issueTrustedDevice(userId, req, days = 7) {
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = this.hashToken(rawToken)
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    const { getClientIp } = require('../utils/clientIp')

    await prisma.trustedDevice.create({
      data: {
        userId,
        tokenHash,
        userAgent: req.headers?.['user-agent'] || null,
        ipAddress: getClientIp(req) || null,
        expiresAt
      }
    })

    return { rawToken, expiresAt }
  }

  async revokeTrustedDevice(userId, token) {
    if (!token) return 0
    const tokenHash = this.hashToken(token)
    const res = await prisma.trustedDevice.updateMany({
      where: {
        userId,
        tokenHash,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    })
    return res.count || 0
  }

  setTrustedCookie(res, token, expiresAt) {
    res.cookie(this.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: expiresAt,
      path: '/api'
    })
  }

  clearTrustedCookie(res) {
    res.cookie(this.cookieName, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/api'
    })
  }
}

module.exports = new TrustedDeviceService()
