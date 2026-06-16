const crypto = require('crypto')

const FIXED_EPC_HEX_LENGTH = 24
const EPC_NAMESPACE_PREFIX = 'D1'

const fileCodeToFixedEpcHex = (fileCode) => {
  const source = String(fileCode ?? '').trim()
  if (!source) {
    throw new Error('File code diperlukan untuk jana EPC hex.')
  }

  const digest = crypto
    .createHash('sha256')
    .update(source, 'utf8')
    .digest('hex')
    .toUpperCase()

  const remainingLength = FIXED_EPC_HEX_LENGTH - EPC_NAMESPACE_PREFIX.length
  return `${EPC_NAMESPACE_PREFIX}${digest.slice(0, remainingLength)}`
}

module.exports = {
  fileCodeToFixedEpcHex,
  FIXED_EPC_HEX_LENGTH
}
