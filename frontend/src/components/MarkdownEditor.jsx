import React, { useMemo, useState } from 'react'
import MarkdownRenderer from './MarkdownRenderer'

export default function MarkdownEditor({ label, value, onChange, rows = 3, placeholder }) {
  const [mode, setMode] = useState('edit')
  const v = typeof value === 'string' ? value : ''

  const isEmpty = useMemo(() => v.trim().length === 0, [v])

  return (
    <div>
      {label ? <label className="block text-sm font-medium text-gray-900 mb-2">{label}</label> : null}
      <div className="flex items-center gap-2 mb-2">
        <button
          type="button"
          onClick={() => setMode('edit')}
          className={`px-3 py-1.5 text-xs rounded-lg border ${mode === 'edit' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
        >
          Edit
        </button>
        <button
          type="button"
          onClick={() => setMode('preview')}
          className={`px-3 py-1.5 text-xs rounded-lg border ${mode === 'preview' ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-700'}`}
        >
          Preview
        </button>
      </div>

      {mode === 'edit' ? (
        <textarea
          value={v}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
      ) : (
        <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-50 min-h-[3rem]">
          {isEmpty ? (
            <div className="text-sm text-gray-400">No content</div>
          ) : (
            <MarkdownRenderer value={v} className="text-sm text-gray-800 space-y-2" />
          )}
        </div>
      )}
    </div>
  )
}
