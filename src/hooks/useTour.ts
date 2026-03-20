import { useEffect, useCallback, useRef } from 'react';
import { driver, type DriveStep, type Config } from 'driver.js';
import 'driver.js/dist/driver.css';

const SEEN_PREFIX = 'tour_seen_';

export function useTour(tourId: string, steps: DriveStep[], opts?: { autoStart?: boolean }) {
  const driverRef = useRef<ReturnType<typeof driver> | null>(null);

  const start = useCallback(() => {
    // Wait for DOM elements to be ready
    requestAnimationFrame(() => {
      const config: Config = {
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayColor: 'rgba(0,0,0,0.6)',
        stagePadding: 8,
        stageRadius: 12,
        popoverClass: 'tour-popover',
        nextBtnText: 'ถัดไป →',
        prevBtnText: '← ก่อนหน้า',
        doneBtnText: 'เสร็จสิ้น ✓',
        progressText: '{{current}} / {{total}}',
        onDestroyed: () => {
          localStorage.setItem(SEEN_PREFIX + tourId, '1');
        },
        steps,
      };
      driverRef.current = driver(config);
      driverRef.current.drive();
    });
  }, [tourId, steps]);

  useEffect(() => {
    if (opts?.autoStart && !localStorage.getItem(SEEN_PREFIX + tourId)) {
      // Delay to let page render
      const timer = setTimeout(start, 800);
      return () => clearTimeout(timer);
    }
  }, [tourId, opts?.autoStart, start]);

  useEffect(() => {
    return () => { driverRef.current?.destroy(); };
  }, []);

  const reset = useCallback(() => {
    localStorage.removeItem(SEEN_PREFIX + tourId);
  }, [tourId]);

  return { start, reset };
}
