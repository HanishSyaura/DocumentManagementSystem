const SGTIN_96_HEADER = '00110000'
const MAX_SGTIN_SERIAL = (2n ** 38n) - 1n

const PARTITION_TABLE = {
  12: { partition: 0, companyPrefixBits: 40, itemReferenceBits: 4, itemReferenceDigits: 1 },
  11: { partition: 1, companyPrefixBits: 37, itemReferenceBits: 7, itemReferenceDigits: 2 },
  10: { partition: 2, companyPrefixBits: 34, itemReferenceBits: 10, itemReferenceDigits: 3 },
  9: { partition: 3, companyPrefixBits: 30, itemReferenceBits: 14, itemReferenceDigits: 4 },
  8: { partition: 4, companyPrefixBits: 27, itemReferenceBits: 17, itemReferenceDigits: 5 },
  7: { partition: 5, companyPrefixBits: 24, itemReferenceBits: 20, itemReferenceDigits: 6 },
  6: { partition: 6, companyPrefixBits: 20, itemReferenceBits: 24, itemReferenceDigits: 7 }
}

const numericPattern = /^\d+$/

const padBinary = (value, bits) => value.toString(2).padStart(bits, '0')

const chunkString = (value, size) => {
  const output = []
  for (let index = 0; index < value.length; index += size) {
    output.push(value.slice(index, index + size))
  }
  return output
}

const computeGs1CheckDigit = (body) => {
  const digits = body.split('').map(Number)
  const total = digits.reduce((sum, digit, index) => {
    const positionFromRight = digits.length - index
    const weight = positionFromRight % 2 === 0 ? 3 : 1
    return sum + (digit * weight)
  }, 0)
  return String((10 - (total % 10)) % 10)
}

const normalizeNumericField = (value, digits, label) => {
  const normalized = String(value ?? '').trim()
  if (!numericPattern.test(normalized)) {
    throw new Error(`${label} mesti nombor sahaja.`)
  }
  if (normalized.length > digits) {
    throw new Error(`${label} melebihi panjang maksimum ${digits} digit.`)
  }
  return normalized.padStart(digits, '0')
}

const getSgtinPartition = (companyPrefixDigits) => {
  const digits = Number(companyPrefixDigits)
  const partition = PARTITION_TABLE[digits]
  if (!partition) {
    throw new Error('Panjang company prefix mesti antara 6 hingga 12 digit.')
  }
  return partition
}

const encodeSgtin96 = ({
  filter = 0,
  companyPrefixDigits = 7,
  companyPrefix,
  itemReference,
  serial
}) => {
  const normalizedFilter = Number(filter)
  if (!Number.isInteger(normalizedFilter) || normalizedFilter < 0 || normalizedFilter > 7) {
    throw new Error('Filter value mesti antara 0 hingga 7.')
  }

  const partition = getSgtinPartition(companyPrefixDigits)
  const normalizedCompanyPrefix = normalizeNumericField(
    companyPrefix,
    Number(companyPrefixDigits),
    'Company prefix'
  )
  const normalizedItemReference = normalizeNumericField(
    itemReference,
    partition.itemReferenceDigits,
    'Item reference'
  )
  const serialText = String(serial ?? '').trim()
  if (!numericPattern.test(serialText)) {
    throw new Error('Serial mesti nombor sahaja.')
  }

  const serialValue = BigInt(serialText)
  if (serialValue > MAX_SGTIN_SERIAL) {
    throw new Error('Serial melebihi kapasiti SGTIN-96 38-bit.')
  }

  const companyPrefixValue = BigInt(normalizedCompanyPrefix)
  const itemReferenceValue = BigInt(normalizedItemReference)

  const binary = [
    SGTIN_96_HEADER,
    padBinary(BigInt(normalizedFilter), 3),
    padBinary(BigInt(partition.partition), 3),
    padBinary(companyPrefixValue, partition.companyPrefixBits),
    padBinary(itemReferenceValue, partition.itemReferenceBits),
    padBinary(serialValue, 38)
  ].join('')

  const hex = BigInt(`0b${binary}`).toString(16).toUpperCase().padStart(24, '0')
  const gtinBody = `${normalizedItemReference[0]}${normalizedCompanyPrefix}${normalizedItemReference.slice(1)}`
  const checkDigit = computeGs1CheckDigit(gtinBody)

  return {
    scheme: 'SGTIN-96',
    filter: normalizedFilter,
    partition: partition.partition,
    companyPrefixDigits: Number(companyPrefixDigits),
    companyPrefix: normalizedCompanyPrefix,
    itemReferenceDigits: partition.itemReferenceDigits,
    itemReference: normalizedItemReference,
    serial: serialText,
    gtin14: `${gtinBody}${checkDigit}`,
    pureIdentityUri: `urn:epc:id:sgtin:${normalizedCompanyPrefix}.${normalizedItemReference}.${serialText}`,
    tagUri: `urn:epc:tag:sgtin-96:${normalizedFilter}.${normalizedCompanyPrefix}.${normalizedItemReference}.${serialText}`,
    binary,
    binaryWords: chunkString(binary, 16),
    hex,
    epcWords: chunkString(hex, 4)
  }
}

module.exports = {
  encodeSgtin96,
  getSgtinPartition,
  MAX_SGTIN_SERIAL
}
