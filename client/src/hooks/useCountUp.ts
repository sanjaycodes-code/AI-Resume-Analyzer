import { useState, useEffect } from 'react';

/**
 * Smoothly animates a number from 0 to target value using requestAnimationFrame and cubic ease-out.
 */
export const useCountUp = (endValue: number, durationMs: number = 600): number => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const target = Math.max(0, Math.round(endValue || 0));
    if (target === 0) {
      setCount(0);
      return;
    }

    let startTimestamp: number | null = null;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / durationMs, 1);
      // Ease out cubic: 1 - (1 - t)^3
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(easeProgress * target));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(animId);
  }, [endValue, durationMs]);

  return count;
};

export default useCountUp;
