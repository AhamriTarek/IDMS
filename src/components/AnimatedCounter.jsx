import React, { useEffect, useRef, useState } from 'react'

export default function AnimatedCounter({ value, duration = 900, className = '', style = {} }) {
  const [display, setDisplay] = useState(0)
  const startRef  = useRef(null)
  const rafRef    = useRef(null)
  const fromRef   = useRef(0)

  useEffect(() => {
    if (value == null || isNaN(value)) return
    const from = fromRef.current
    const to   = Number(value)
    if (from === to) return

    const start = performance.now()
    const easeOut = (t) => 1 - Math.pow(1 - t, 3)

    const tick = (now) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const current  = Math.round(from + (to - from) * easeOut(progress))
      setDisplay(current)
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return (
    <span className={className} style={{ fontVariantNumeric: 'tabular-nums', ...style }}>
      {display.toLocaleString('fr-FR')}
    </span>
  )
}
