import React from 'react'
import AppSurface from '../ui/AppSurface'
import SkeletonBlock from '../ui/SkeletonBlock'

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <AppSurface key={index} padding="md" className="space-y-4">
            <div className="flex items-start gap-3">
              <SkeletonBlock className="h-11 w-11 rounded-2xl" />
              <SkeletonBlock className="h-4 w-28" />
            </div>
            <SkeletonBlock className="h-8 w-20" />
            <SkeletonBlock className="h-3 w-40" />
          </AppSurface>
        ))}
      </div>
      <AppSurface padding="lg" className="space-y-4">
        <SkeletonBlock className="h-5 w-48" />
        <SkeletonBlock className="h-4 w-72" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <SkeletonBlock key={index} className="h-14 w-full" />
          ))}
        </div>
      </AppSurface>
    </div>
  )
}
