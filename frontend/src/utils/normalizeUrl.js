export function normalizeAppPath(urlOrPath) {
  if (!urlOrPath || typeof urlOrPath !== 'string') return urlOrPath
  if (urlOrPath.startsWith('data:') || urlOrPath.startsWith('blob:') || urlOrPath.startsWith('/')) {
    return urlOrPath
  }
  try {
    const u = new URL(urlOrPath)
    return `${u.pathname}${u.search}${u.hash}`
  } catch {
    return urlOrPath
  }
}
