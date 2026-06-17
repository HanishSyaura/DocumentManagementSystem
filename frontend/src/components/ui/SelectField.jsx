import React from 'react'

export default function SelectField({
  className = '',
  invalid = false,
  children,
  ...props
}) {
  const classes = [
    'h-10 w-full rounded-2xl border bg-surface px-3 text-sm text-ink outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-brand/30',
    invalid ? 'border-red-300 focus-visible:ring-red-200/80' : 'border-border',
    className
  ].filter(Boolean).join(' ')

  return (
    <select className={classes} {...props}>
      {children}
    </select>
  )
}

