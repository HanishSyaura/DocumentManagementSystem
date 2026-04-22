function normalizeIp(ip) {
  const raw = String(ip || '').trim()
  if (!raw) return ''
  if (raw.startsWith('::ffff:')) return raw.slice('::ffff:'.length)
  if (raw === '::1') return '127.0.0.1'
  return raw
}

function getClientIp(req) {
  if (!req) return ''
  const fromExpress = Array.isArray(req.ips) && req.ips.length > 0 ? req.ips[0] : req.ip
  const fromHeaders = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim()
    || String(req.headers?.['x-real-ip'] || '').trim()
    || String(req.headers?.['cf-connecting-ip'] || '').trim()
  const fromSocket = req.socket?.remoteAddress || req.connection?.remoteAddress || ''
  return normalizeIp(fromExpress || fromHeaders || fromSocket)
}

module.exports = { getClientIp, normalizeIp }
