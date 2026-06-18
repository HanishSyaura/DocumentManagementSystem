import React from 'react'

export default function InlineSpinner({ className = '' }) {
  return (
    <span
      className={['inline-block h-5 w-5 animate-spin rounded-full border-2 border-border border-t-brand', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
