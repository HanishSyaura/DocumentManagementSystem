import React from 'react'

export default function SectionHeader({
  title,
  subtitle,
  actions = null,
  className = ''
}) {
  return (
    <div className={['flex flex-col gap-2 md:flex-row md:items-start md:justify-between', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  )
}
