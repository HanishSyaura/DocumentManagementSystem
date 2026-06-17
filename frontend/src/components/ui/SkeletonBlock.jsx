import React from 'react'

export default function SkeletonBlock({
  className = ''
}) {
  return (
    <div
      className={['animate-pulse rounded-xl bg-slate-200/80', className].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  )
}
