// src/hooks/useBodyScrollLock.js
// iOS-safe scroll lock for modals that prevents background scrolling
// while allowing modal content to scroll

import { useEffect, useRef } from 'react'

export function useBodyScrollLock(isLocked) {
  const scrollYRef = useRef(0)
  const originalStylesRef = useRef({})

  useEffect(() => {
    if (!isLocked) return

    // Capture current scroll position
    scrollYRef.current = window.scrollY

    // Store original styles
    originalStylesRef.current = {
      bodyPosition: document.body.style.position,
      bodyTop: document.body.style.top,
      bodyLeft: document.body.style.left,
      bodyRight: document.body.style.right,
      bodyWidth: document.body.style.width,
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
    }

    // Apply iOS-safe scroll lock
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollYRef.current}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'

    // Prevent touchmove on document (but allow inside modal)
    const preventTouchMove = (e) => {
      // Check if the touch is inside a scrollable modal content area
      const target = e.target
      const isInsideScrollable = target.closest('[data-scroll-lock-scrollable]')

      if (!isInsideScrollable) {
        e.preventDefault()
      }
    }

    document.addEventListener('touchmove', preventTouchMove, { passive: false })

    // Cleanup function
    return () => {
      // Remove touchmove listener
      document.removeEventListener('touchmove', preventTouchMove)

      // Restore original styles
      const original = originalStylesRef.current
      document.body.style.position = original.bodyPosition
      document.body.style.top = original.bodyTop
      document.body.style.left = original.bodyLeft
      document.body.style.right = original.bodyRight
      document.body.style.width = original.bodyWidth
      document.body.style.overflow = original.bodyOverflow
      document.documentElement.style.overflow = original.htmlOverflow

      // Restore scroll position
      window.scrollTo(0, scrollYRef.current)
    }
  }, [isLocked])
}

export default useBodyScrollLock
