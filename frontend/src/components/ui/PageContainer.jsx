import React from 'react'

const sizeMap = {
  default: '',
  wide: 'max-w-[1600px]',
  dashboard: 'max-w-[1480px]'
}

export default function PageContainer({
  children,
  className = '',
  size = 'default',
  ...props
}) {
  const classes = [
    'dms-page-container',
    sizeMap[size] || sizeMap.default,
    className
  ].filter(Boolean).join(' ')

  return <div className={classes} {...props}>{children}</div>
}
