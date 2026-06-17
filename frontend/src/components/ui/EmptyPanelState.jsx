import React from 'react'

export default function EmptyPanelState({
  title,
  description,
  icon = null,
  className = ''
}) {
  return (
    <div className={['flex flex-col items-center justify-center rounded-dms border border-dashed border-border bg-surface-muted px-4 py-8 text-center', className].filter(Boolean).join(' ')}>
      {icon && <div className="mb-3 text-ink-soft">{icon}</div>}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description && <p className="mt-1 max-w-xs text-xs leading-5 text-ink-muted">{description}</p>}
    </div>
  )
}
