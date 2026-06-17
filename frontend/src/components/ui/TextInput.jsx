import React from 'react'

export default function TextInput({
  className = '',
  invalid = false,
  ...props
}) {
  const classes = [
    'h-10 w-full rounded-2xl border bg-surface px-3 text-sm text-ink outline-none transition-shadow placeholder:text-ink-soft focus-visible:ring-2 focus-visible:ring-brand/30',
    invalid ? 'border-red-300 focus-visible:ring-red-200/80' : 'border-border',
    className
  ].filter(Boolean).join(' ')

  return <input className={classes} {...props} />
}

