import React from 'react'

export default function PageHeader({
  title,
  subtitle,
  actions = null,
  className = ''
}) {
  return (
    <header className={['flex flex-col gap-4 md:flex-row md:items-start md:justify-between', className].filter(Boolean).join(' ')}>
      <div className="min-w-0">
        <h1 className="text-[1.625rem] font-semibold leading-tight text-ink">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm leading-6 text-ink-muted">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  )
}
