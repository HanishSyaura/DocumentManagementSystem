import React from 'react'

const sizeMap = {
  default: null,
  wide: '1600px',
  dashboard: '1440px'
}

export default function PageContainer({
  children,
  className = '',
  size = 'default',
  ...props
}) {
  const sizeValue = sizeMap[size] ?? sizeMap.default
  const style = sizeValue
    ? { ...(props.style || {}), '--dms-page-container-max': sizeValue }
    : props.style

  const classes = [
    'dms-page-container',
    className
  ].filter(Boolean).join(' ')

  return <div className={classes} {...props} style={style}>{children}</div>
}
