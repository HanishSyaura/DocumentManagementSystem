const fileCodeToHex = (fileCode) => {
  const source = String(fileCode ?? '').trim()
  if (!source) {
    throw new Error('File code diperlukan untuk jana EPC hex.')
  }

  return Buffer.from(source, 'utf8').toString('hex').toUpperCase()
}

module.exports = {
  fileCodeToHex
}
