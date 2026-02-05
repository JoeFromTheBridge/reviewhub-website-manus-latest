// src/hooks/useIsMobileFiltersMode.js
// Determines whether to use mobile filters modal vs desktop sidebar
// Handles both true mobile AND "Request Desktop Site" on phones

import { useState, useEffect } from 'react';

// Breakpoint for desktop sidebar filters
const DESKTOP_BREAKPOINT = 1024;

// Even with "desktop site", phones rarely have viewports wider than this
// Combined with touch detection, this catches most edge cases
const TOUCH_DEVICE_MAX_WIDTH = 1400;

/**
 * Hook to determine if mobile filters mode should be used.
 *
 * Returns true (use mobile modal) when:
 * - Viewport width < 1024px (standard mobile/tablet), OR
 * - Device has touch capability AND viewport < 1400px (catches "desktop site" on phones)
 *
 * Returns false (use desktop sidebar) when:
 * - Viewport >= 1024px AND (no touch OR viewport >= 1400px)
 */
export function useIsMobileFiltersMode() {
  const [isMobileMode, setIsMobileMode] = useState(() => {
    // Initial check on mount
    if (typeof window === 'undefined') return true;
    return checkIsMobileMode();
  });

  useEffect(() => {
    // Update on mount and when window resizes
    const handleResize = () => {
      setIsMobileMode(checkIsMobileMode());
    };

    // Check immediately
    handleResize();

    // Listen for resize events
    window.addEventListener('resize', handleResize);

    // Also listen for orientation changes (important for mobile)
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return isMobileMode;
}

function checkIsMobileMode() {
  if (typeof window === 'undefined') return true;

  const viewportWidth = window.innerWidth;

  // Standard check: viewport below desktop breakpoint
  if (viewportWidth < DESKTOP_BREAKPOINT) {
    return true;
  }

  // Touch device check for "Request Desktop Site" scenarios
  // navigator.maxTouchPoints > 0 indicates touch capability
  const isTouchDevice =
    navigator.maxTouchPoints > 0 ||
    'ontouchstart' in window ||
    // @ts-ignore - Some older browsers use this
    (window.DocumentTouch && document instanceof window.DocumentTouch);

  // If it's a touch device AND viewport is below the generous threshold,
  // treat it as mobile (catches phones using "desktop site")
  if (isTouchDevice && viewportWidth < TOUCH_DEVICE_MAX_WIDTH) {
    return true;
  }

  // Large viewport without touch, or large viewport with touch but very wide
  // (like a Surface Pro in desktop mode) = use desktop sidebar
  return false;
}

export default useIsMobileFiltersMode;
