import React from 'react'
import IconButton from '../ui/IconButton'

export default function AppRightPanelToggle({
  collapsed,
  onClick
}) {
  return (
    <div
      className="fixed right-0 z-50 hidden xl:block"
      style={{ top: 'calc(var(--dms-layout-topbar-height) + 12px)' }}
    >
      <IconButton
        onClick={onClick}
        className="rounded-r-none border-r-0 shadow-dms-lg"
        aria-label={collapsed ? 'Expand notifications panel' : 'Collapse notifications panel'}
      >
        <svg className={['h-5 w-5 transition-transform', collapsed ? '' : 'rotate-180'].join(' ')} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </IconButton>
    </div>
  )
}
