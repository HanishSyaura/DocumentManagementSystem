import React from 'react'

const paddingMap = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5'
}

const variantMap = {
  default: 'dms-surface',
  muted: 'dms-surface-muted',
  panel: 'bg-surface border border-border shadow-dms-soft rounded-dms',
  interactive: 'dms-surface transition-all duration-200 hover:-translate-y-0.5 hover:shadow-dms-lg'
}

export default function AppSurface({
  as: Component = 'div',
  children,
  className = '',
  padding = 'md',
  variant = 'default',
  ...props
}) {
  const classes = [
    variantMap[variant] || variantMap.default,
    paddingMap[padding] || paddingMap.md,
    className
  ].filter(Boolean).join(' ')

  return <Component className={classes} {...props}>{children}</Component>
}
