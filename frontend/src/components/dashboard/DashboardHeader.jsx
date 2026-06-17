import React from 'react'
import PageHeader from '../ui/PageHeader'

export default function DashboardHeader({ title, subtitle, actions, className = '', ...props }) {
  return (
    <PageHeader
      title={title}
      subtitle={subtitle}
      actions={actions}
      className={className}
      {...props}
    />
  )
}
