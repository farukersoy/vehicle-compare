'use client'

import { useEffect, useRef, useState } from 'react'

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Animates from the previous value to `target` (ease-out); on mount it counts
 * up from 0. Instant with reduced motion. Only used client-side (after a
 * selection), so there is no SSR/hydration mismatch.
 */
export function useCountUp(target: number, durationMs = 600): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0))
  const fromRef = useRef(prefersReducedMotion() ? target : 0)

  useEffect(() => {
    const from = fromRef.current
    fromRef.current = target
    if (from === target) return
    if (prefersReducedMotion()) { setValue(target); return }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(from + (target - from) * eased)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}

export function smoothScrollTo(el: Element | null) {
  if (!el) return
  el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
}
