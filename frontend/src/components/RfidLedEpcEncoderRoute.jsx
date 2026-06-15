import React from 'react'
import Layout from './Layout'
import RfidLedEpcEncoder from './RfidLedEpcEncoder'

export default function RfidLedEpcEncoderRoute() {
  const hasToken = Boolean(localStorage.getItem('token'))

  if (!hasToken) {
    return (
      <div className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <RfidLedEpcEncoder />
        </div>
      </div>
    )
  }

  return (
    <Layout>
      <RfidLedEpcEncoder />
    </Layout>
  )
}
