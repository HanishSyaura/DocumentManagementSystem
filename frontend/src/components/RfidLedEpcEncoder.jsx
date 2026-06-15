import React, { useMemo, useState } from 'react'
import {
  DEFAULT_SGTIN_SAMPLE,
  FILTER_OPTIONS,
  encodeSgtin96,
  getSgtinPartition
} from '../utils/epcEncoder'

const initialForm = {
  filter: DEFAULT_SGTIN_SAMPLE.filter,
  companyPrefixDigits: DEFAULT_SGTIN_SAMPLE.companyPrefixDigits,
  companyPrefix: DEFAULT_SGTIN_SAMPLE.companyPrefix,
  itemReference: DEFAULT_SGTIN_SAMPLE.itemReference,
  serial: DEFAULT_SGTIN_SAMPLE.serial
}

const resultCards = [
  { key: 'tagUri', label: 'Tag URI', mono: false },
  { key: 'pureIdentityUri', label: 'Pure Identity URI', mono: false },
  { key: 'gtin14', label: 'GTIN-14', mono: true },
  { key: 'hex', label: 'EPC Hex (24 chars)', mono: true }
]

function CopyButton({ value, label }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!value) return

    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1200)
    } catch (error) {
      console.error(`Failed to copy ${label}`, error)
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
    >
      {copied ? 'Copied' : `Copy ${label}`}
    </button>
  )
}

function OutputRow({ label, value, mono = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-900">{label}</h3>
        <CopyButton value={value} label={label} />
      </div>
      <div className={`break-all rounded-lg bg-slate-50 px-3 py-3 text-sm text-slate-800 ${mono ? 'font-mono' : ''}`}>
        {value}
      </div>
    </div>
  )
}

export default function RfidLedEpcEncoder() {
  const [form, setForm] = useState(initialForm)

  const partitionMeta = useMemo(() => {
    try {
      return getSgtinPartition(form.companyPrefixDigits)
    } catch {
      return null
    }
  }, [form.companyPrefixDigits])

  const encodedResult = useMemo(() => {
    try {
      return {
        data: encodeSgtin96(form),
        error: ''
      }
    } catch (error) {
      return {
        data: null,
        error: error.message || 'Gagal encode EPC.'
      }
    }
  }, [form])

  const handleChange = (field) => (event) => {
    const nextValue = event.target.value
    setForm((current) => ({ ...current, [field]: nextValue }))
  }

  const loadSample = () => {
    setForm(initialForm)
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 p-6 text-white shadow-lg">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">RFID LED EPC Module</p>
            <h1 className="text-2xl font-semibold sm:text-3xl">RFID LED EPC Code Encoding</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-200">
              Module ini encode identifier kepada format EPC standard untuk RFID. Release awal ini fokus pada
              <span className="font-semibold text-white"> SGTIN-96 </span>
              dengan output terus dalam bentuk `Tag URI`, `Pure Identity URI`, `binary 96-bit`, `hex EPC`, dan `GTIN-14`.
            </p>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/10 p-4 text-sm text-slate-100 backdrop-blur-sm">
            <p className="font-semibold">Quick Notes</p>
            <p className="mt-2">- Company prefix: 6 hingga 12 digit</p>
            <p>- Item reference ikut partition GS1 automatik</p>
            <p>- Serial disimpan dalam 38-bit field</p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Input EPC</h2>
              <p className="mt-1 text-sm text-slate-600">Isi nilai GS1 dan hasil encoding akan update secara langsung.</p>
            </div>
            <button
              type="button"
              onClick={loadSample}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Load Sample
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Scheme</span>
              <input
                value="SGTIN-96"
                readOnly
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700 outline-none"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Filter Value</span>
              <select
                value={form.filter}
                onChange={handleChange('filter')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {FILTER_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Company Prefix Digits</span>
              <select
                value={form.companyPrefixDigits}
                onChange={handleChange('companyPrefixDigits')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {[6, 7, 8, 9, 10, 11, 12].map((digits) => (
                  <option key={digits} value={digits}>
                    {digits} digits
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Company Prefix</span>
              <input
                value={form.companyPrefix}
                onChange={handleChange('companyPrefix')}
                inputMode="numeric"
                placeholder="Contoh: 9551234"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Item Reference
                {partitionMeta && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    diperlukan {partitionMeta.itemReferenceDigits} digit
                  </span>
                )}
              </span>
              <input
                value={form.itemReference}
                onChange={handleChange('itemReference')}
                inputMode="numeric"
                placeholder="Item reference termasuk indicator digit"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">Serial</span>
              <input
                value={form.serial}
                onChange={handleChange('serial')}
                inputMode="numeric"
                placeholder="Contoh: 123456"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </label>
          </div>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <h3 className="text-sm font-semibold text-blue-900">Partition Summary</h3>
            {partitionMeta ? (
              <div className="mt-2 grid gap-3 text-sm text-blue-900 sm:grid-cols-3">
                <div>
                  <p className="font-medium">Partition</p>
                  <p>{partitionMeta.partition}</p>
                </div>
                <div>
                  <p className="font-medium">Company Prefix Bits</p>
                  <p>{partitionMeta.companyPrefixBits}</p>
                </div>
                <div>
                  <p className="font-medium">Item Reference Bits</p>
                  <p>{partitionMeta.itemReferenceBits}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-sm text-blue-900">Pilih company prefix digits yang sah untuk lihat partition detail.</p>
            )}
          </div>

          {encodedResult.error && (
            <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {encodedResult.error}
            </div>
          )}
        </section>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Encoded Output</h2>
              <p className="mt-1 text-sm text-slate-600">Output ini boleh terus dipakai untuk semakan, integrasi middleware, atau tulis ke EPC memory.</p>
            </div>

            {encodedResult.data ? (
              <div className="space-y-4">
                {resultCards.map((card) => (
                  <OutputRow
                    key={card.key}
                    label={card.label}
                    value={encodedResult.data[card.key]}
                    mono={card.mono}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                Betulkan input untuk jana EPC output.
              </div>
            )}
          </div>

          {encodedResult.data && (
            <>
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">Binary 96-bit</h3>
                  <CopyButton value={encodedResult.data.binary} label="Binary" />
                </div>
                <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs leading-6 text-emerald-300">
                  {encodedResult.data.binaryWords.map((word, index) => (
                    <span key={`${word}-${index}`} className="mr-3 inline-block">
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-slate-900">EPC Memory Words</h3>
                  <CopyButton value={encodedResult.data.epcWords.join(' ')} label="Words" />
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {encodedResult.data.epcWords.map((word, index) => (
                    <div key={`${word}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Word {index + 1}</p>
                      <p className="mt-1 font-mono text-lg font-semibold text-slate-900">{word}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
