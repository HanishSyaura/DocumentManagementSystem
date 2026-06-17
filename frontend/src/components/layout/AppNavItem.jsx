import React from 'react'
import { Link } from 'react-router-dom'

export default function AppNavItem({
  item,
  active = false,
  collapsed = false,
  onClick,
  isTourTarget = false
}) {
  const baseClasses = collapsed
    ? 'justify-center px-2 py-3'
    : 'gap-3 px-3.5 py-3'

  const stateClasses = active
    ? 'bg-white/16 text-white shadow-dms-soft ring-1 ring-white/10'
    : 'text-white/80 hover:bg-white/8 hover:text-white'

  return (
    <Link
      to={item.path}
      onClick={onClick}
      data-tour-id={item.tourId}
      title={collapsed ? item.name : undefined}
      className={[
        'group relative flex items-center rounded-2xl text-sm font-medium transition-all duration-200',
        baseClasses,
        stateClasses,
        isTourTarget ? 'ring-2 ring-yellow-300 animate-pulse' : ''
      ].filter(Boolean).join(' ')}
    >
      {!collapsed && (
        <span className={['absolute left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-brand-secondary transition-opacity', active ? 'opacity-100' : 'opacity-0'].join(' ')} />
      )}
      <span className={['shrink-0 transition-transform', active ? 'scale-105' : ''].join(' ')}>
        {item.icon}
      </span>
      {!collapsed && <span className="truncate">{item.name}</span>}
      {collapsed && (
        <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-xs text-white opacity-0 translate-x-1 shadow-lg transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 group-focus-visible:translate-x-0 group-focus-visible:opacity-100">
          {item.name}
        </span>
      )}
    </Link>
  )
}
