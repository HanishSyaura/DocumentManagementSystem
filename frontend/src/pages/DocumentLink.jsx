import React, { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'

export default function DocumentLink() {
  const navigate = useNavigate()
  const { id } = useParams()

  useEffect(() => {
    const raw = parseInt(id, 10)
    const docId = Number.isFinite(raw) ? raw : null
    if (!docId) {
      navigate('/dashboard', { replace: true })
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      try {
        localStorage.setItem('postLoginRedirect', `/documents/${docId}`)
      } catch {}
      navigate('/login', { replace: true })
      return
    }

    let cancelled = false
    ;(async () => {
      try {
        const res = await api.get(`/documents/${docId}`)
        if (cancelled) return

        const doc =
          res.data?.data?.document ||
          res.data?.document ||
          res.data?.data ||
          res.data

        const stage = String(doc?.stage || '').toUpperCase()

        if (stage === 'DRAFT') {
          navigate(`/drafts?docId=${docId}`, { replace: true })
          return
        }

        if (stage === 'PUBLISHED') {
          navigate(`/published?docId=${docId}`, { replace: true })
          return
        }

        navigate(`/review-approval?docId=${docId}`, { replace: true })
      } catch {
        if (cancelled) return
        navigate(`/review-approval?docId=${docId}`, { replace: true })
      }
    })()

    return () => {
      cancelled = true
    }
  }, [id, navigate])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-sm text-gray-600">Redirecting…</div>
    </div>
  )
}

