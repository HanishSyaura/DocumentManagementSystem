import React from 'react'
import AppSurface from '../ui/AppSurface'

const toneMap = {
  indigo: 'bg-indigo-50 text-indigo-600',
  warning: 'bg-amber-50 text-amber-600',
  success: 'bg-emerald-50 text-emerald-600',
  neutral: 'bg-slate-100 text-slate-600'
}

export default function DashboardMetricCard({
  title,
  value,
  description,
  icon: Icon,
  tone = 'indigo'
}) {
  return (
    <AppSurface variant="interactive" padding="md" className="h-full">
      <div className="flex h-full flex-col">
        <div className="mb-4 flex items-start gap-3">
          <div className={['flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl', toneMap[tone] || toneMap.indigo].join(' ')}>
            <Icon className="h-5 w-5" />
          </div>
          <h3 className="min-w-0 flex-1 text-[13px] font-semibold leading-5 text-ink-secondary">{title}</h3>
        </div>
        <div className="mb-2 text-[1.875rem] font-semibold leading-none text-ink">{value}</div>
        <p className="mt-auto text-xs leading-5 text-ink-muted">{description}</p>
      </div>
    </AppSurface>
  )
}
