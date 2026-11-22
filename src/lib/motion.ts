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
  // The value currently on screen. Animations start from it, so an interrupted
  // or re-run effect (React runs effects twice in development) still ends on target.
  const shownRef = useRef(prefersReducedMotion() ? target : 0)

  useEffect(() => {
    const from = shownRef.current
    if (from === target) return
    if (prefersReducedMotion()) { shownRef.current = target; setValue(target); return }

    let raf = 0
    const start = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - p, 3)
      const v = p >= 1 ? target : from + (target - from) * eased
      shownRef.current = v
      setValue(v)
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
