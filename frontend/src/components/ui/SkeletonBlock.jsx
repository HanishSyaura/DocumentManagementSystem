import React from 'react'

export default function SkeletonBlock({
  className = ''
}) {
  return (
    <div
      className={['animate-pulse rounded-xl bg-surface-muted', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
