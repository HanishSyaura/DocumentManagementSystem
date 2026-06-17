import React from 'react'
import { normalizeAppPath } from '../../utils/normalizeUrl'

export default function AppTopbarBrand({
  logo,
  companyName,
  appLabel,
  compact = false
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      {logo ? (
        <div className="flex h-10 items-center rounded-xl bg-white px-2 shadow-dms-soft">
          <img
            src={normalizeAppPath(logo)}
            alt="Company Logo"
            className="max-h-8 max-w-[120px] object-contain sm:max-w-[168px]"
          />
        </div>
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-sm font-bold text-brand shadow-dms-soft">
          {String(companyName || 'FN').substring(0, 2).toUpperCase()}
        </div>
      )}

      {!compact && (
        <div className="hidden min-w-0 md:flex md:flex-col">
          <span className="truncate text-sm font-semibold text-ink-inverse">{companyName}</span>
          <span className="text-xs text-white/75">{appLabel}</span>
        </div>
      )}
    </div>
  )
}
