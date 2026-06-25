import React from 'react'

export default function AppShell({
  topbar,
  leftSidebar,
  rightSidebar,
  rightPanel,
  footer,
  children
}) {
  const mainRef = React.useRef(null)
  const shellRef = React.useRef(null)

  const handleWheelCapture = React.useCallback((e) => {
    const shellEl = shellRef.current
    const mainEl = mainRef.current
    if (!shellEl || !mainEl) return

    const target = e.target instanceof Element ? e.target : null
    if (!target) return

    if (mainEl.contains(target)) return

    let node = target
    while (node && node !== shellEl) {
      const style = window.getComputedStyle(node)
      const overflowY = style.overflowY
      const canScrollY =
        (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') &&
        node.scrollHeight > node.clientHeight + 1

      if (canScrollY) return
      node = node.parentElement
    }

    mainEl.scrollTop += e.deltaY
  }, [])

  return (
    <div ref={shellRef} className="flex h-screen flex-col bg-canvas" onWheelCapture={handleWheelCapture}>
      {topbar}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {leftSidebar}
        <main ref={mainRef} className="app-main-content dms-scrollbar min-h-0 flex-1 overflow-y-auto">
          {children}
          {footer}
        </main>
        {rightSidebar}
        {rightPanel}
      </div>
    </div>
  )
}
