import React from 'react'
import { Link } from 'react-router-dom'
import AppSurface from '../ui/AppSurface'
import SectionHeader from '../ui/SectionHeader'
import EmptyPanelState from '../ui/EmptyPanelState'
import { normalizeAppPath } from '../../utils/normalizeUrl'

function Avatar({ name, profileImage }) {
  const safeName = String(name || 'User').trim()
  const names = safeName.split(' ').filter(Boolean)
  const initials = names.length >= 2
    ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    : safeName.substring(0, 2).toUpperCase()

  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-sky-400 to-brand text-sm font-semibold text-white shadow-dms-soft">
      {profileImage ? (
        <img src={normalizeAppPath(profileImage)} alt={safeName} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  )
}

export default function DashboardActivityTable({
  title,
  subtitle,
  recent,
  formatRelativeTime,
  viewAllLabel,
  columns,
  viewAllTo = '/logs',
  emptyTitle,
  emptyDescription
}) {
  return (
    <AppSurface padding="lg" className="space-y-4">
      <SectionHeader title={title} subtitle={subtitle} />

      {recent.length > 0 ? (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-ink-soft">
                  <th className="px-2 py-3 w-[40%]">{columns?.userDocument}</th>
                  <th className="px-2 py-3 w-[35%]">{columns?.action}</th>
                  <th className="px-2 py-3 text-right w-[25%]">{columns?.time}</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((item, index) => (
                  <tr key={index} className="border-b border-border/70 transition-colors hover:bg-slate-50/70">
                    <td className="px-2 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={item.user} profileImage={item.profileImage} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-ink">{item.user}</div>
                          <div className="truncate text-xs text-brand">{item.document}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-3.5 text-sm text-ink-secondary">{item.action}</td>
                    <td className="px-2 py-3.5 text-right text-xs text-ink-muted whitespace-nowrap">
                      {item.updatedAt ? formatRelativeTime(item.updatedAt) : item.when}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 md:hidden">
            {recent.map((item, index) => (
              <div key={index} className="rounded-2xl border border-border bg-surface-muted p-3">
                <div className="flex items-start gap-3">
                  <Avatar name={item.user} profileImage={item.profileImage} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-ink">{item.user}</div>
                        <div className="truncate text-xs text-brand">{item.document}</div>
                      </div>
                      <div className="shrink-0 text-[11px] text-ink-muted">
                        {item.updatedAt ? formatRelativeTime(item.updatedAt) : item.when}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-ink-secondary">{item.action}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border pt-4 text-center">
            <Link className="text-sm font-medium text-brand transition-colors hover:text-brand-hover hover:underline" to={viewAllTo}>
              {viewAllLabel} →
            </Link>
          </div>
        </>
      ) : (
        <EmptyPanelState
          title={emptyTitle}
          description={emptyDescription}
        />
      )}
    </AppSurface>
  )
}
