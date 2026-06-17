import React from 'react'

const sizeMap = {
  sm: 'h-9 px-3 text-sm rounded-2xl',
  md: 'h-10 px-4 text-sm rounded-2xl',
  lg: 'h-11 px-5 text-sm rounded-2xl'
}

const variantMap = {
  primary: 'bg-brand text-ink-inverse border border-white/10 shadow-dms-soft hover:bg-brand-hover',
  secondary: 'bg-surface text-ink-secondary border border-border shadow-dms-soft hover:bg-surface-muted hover:text-ink',
  ghost: 'bg-transparent text-ink-secondary hover:bg-surface-muted hover:text-ink',
  danger: 'bg-red-600 text-white border border-red-700/20 shadow-dms-soft hover:bg-red-700'
}

export default function Button({
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...props
}) {
  const classes = [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50',
    sizeMap[size] || sizeMap.md,
    variantMap[variant] || variantMap.primary,
    className
  ].filter(Boolean).join(' ')

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  )
}

