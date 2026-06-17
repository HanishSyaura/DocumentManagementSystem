import React from 'react'

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10'
}

export default function IconButton({
  type = 'button',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center rounded-xl border border-border bg-surface text-ink-secondary shadow-dms-soft transition-colors hover:bg-surface-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
    sizeMap[size] || sizeMap.md,
    className
  ].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}
