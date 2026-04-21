import React, { useEffect, useMemo, useState } from 'react'
import { getUploadProgress, subscribeUploadProgress } from '../utils/uploadProgressStore'

export default function UploadProgressBar() {
  const [progress, setProgress] = useState(() => getUploadProgress())

  useEffect(() => {
    return subscribeUploadProgress(setProgress)
  }, [])

  const percentText = useMemo(() => {
    if (typeof progress.percent !== 'number') return null
    return `${progress.percent}%`
  }, [progress.percent])

  if (!progress.active) return null

  const widthStyle =
    typeof progress.percent === 'number'
      ? { width: `${Math.max(0, Math.min(100, progress.percent))}%` }
      : { width: '35%' }

  return (
    <div className="fixed top-0 left-0 right-0 z-[70] pointer-events-none">
      <div className="h-1 bg-transparent">
        <div className="h-1 bg-blue-600 transition-all duration-150" style={widthStyle} />
      </div>
      <div className="flex justify-end px-3 pt-2">
        <div className="bg-gray-900/80 text-white text-xs rounded-md px-2 py-1 flex items-center gap-2">
          {typeof progress.percent !== 'number' && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
          )}
          <span>{progress.label || 'Uploading...'}</span>
          {percentText && <span className="opacity-90">{percentText}</span>}
        </div>
      </div>
    </div>
  )
}
