import { useState, useEffect } from 'react'

const BREAKPOINTS = { xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280 }

export function useBreakpoint() {
  const [bp, setBp] = useState(() => {
    if (typeof window === 'undefined') return 'md'
    const w = window.innerWidth
    if (w >= BREAKPOINTS.xl) return 'xl'
    if (w >= BREAKPOINTS.lg) return 'lg'
    if (w >= BREAKPOINTS.md) return 'md'
    if (w >= BREAKPOINTS.sm) return 'sm'
    return 'xs'
  })

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w >= BREAKPOINTS.xl) setBp('xl')
      else if (w >= BREAKPOINTS.lg) setBp('lg')
      else if (w >= BREAKPOINTS.md) setBp('md')
      else if (w >= BREAKPOINTS.sm) setBp('sm')
      else setBp('xs')
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return bp
}
