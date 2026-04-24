import { useCallback, useEffect, useRef, useState } from 'react'

export default function useDocxFitToWidth({ enabled, mode, viewportRef, containerRef }) {
  const [scale, setScale] = useState(1)
  const rafRef = useRef(0)

  const measureAndUpdate = useCallback(() => {
    if (!enabled) return

    const viewport = viewportRef?.current
    const container = containerRef?.current
    if (!viewport || !container) return

    const docxEl = container.querySelector('.docx')
    if (!docxEl) return

    if (mode !== 'fit') {
      setScale(1)
      return
    }

    const viewportWidth = viewport.clientWidth
    const docxWidth = docxEl.scrollWidth || docxEl.getBoundingClientRect().width
    if (!viewportWidth || !docxWidth) return

    const next = Math.min(1, viewportWidth / docxWidth)
    setScale((prev) => (Math.abs(prev - next) < 0.001 ? prev : next))
  }, [enabled, mode, viewportRef, containerRef])

  const refresh = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      measureAndUpdate()
    })
  }, [measureAndUpdate])

  useEffect(() => {
    refresh()
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [refresh])

  useEffect(() => {
    if (!enabled || mode !== 'fit') return

    const viewport = viewportRef?.current
    const container = containerRef?.current
    if (!viewport || !container) return

    const ro = new ResizeObserver(() => refresh())
    ro.observe(viewport)
    ro.observe(container)
    window.addEventListener('resize', refresh)

    return () => {
      ro.disconnect()
      window.removeEventListener('resize', refresh)
    }
  }, [enabled, mode, viewportRef, containerRef, refresh])

  useEffect(() => {
    if (!enabled) return
    const container = containerRef?.current
    if (!container) return
    const docxEl = container.querySelector('.docx')
    if (!docxEl) return

    if (mode === 'fit' && scale < 1) {
      docxEl.style.transformOrigin = 'top center'
      docxEl.style.transform = `scale(${scale})`
      docxEl.style.willChange = 'transform'
    } else {
      docxEl.style.transform = ''
      docxEl.style.transformOrigin = ''
      docxEl.style.willChange = ''
    }
  }, [enabled, mode, scale, containerRef])

  return { scale, refresh }
}
