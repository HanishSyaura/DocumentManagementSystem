import React from 'react'

export default function AppShell({
  topbar,
  leftSidebar,
  rightSidebar,
  rightPanel,
  footer,
  children
}) {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      {topbar}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {leftSidebar}
        <main className="app-main-content dms-scrollbar min-h-0 flex-1 overflow-y-auto">
          {children}
          {footer}
        </main>
        {rightSidebar}
        {rightPanel}
      </div>
    </div>
  )
}
