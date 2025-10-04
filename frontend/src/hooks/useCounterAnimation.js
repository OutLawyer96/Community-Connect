import { useState, useEffect, useCallback, useRef } from "react";

// Easing functions - defined at module scope to avoid recreation on every render
const easingFunctions = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => t * (2 - t),
  easeInOut: (t) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
};

/**
 * Custom hook for animated number counting
 * @param {Object} options - Hook options
 * @param {number} options.end - Target number to count to
 * @param {number} [options.start] - Starting number
 * @param {number} [options.duration] - Animation duration in ms
 * @param {string} [options.easing] - Easing function type (linear, easeIn, easeOut, easeInOut)
 * @param {number} [options.delay] - Delay before starting animation
 * @param {boolean} [options.autoStart] - Start animation automatically
 * @returns {Object} Counter state and controls
 */
const useCounterAnimation = ({
  end,
  start = 0,
  duration = 2000,
  easing = "easeOut",
  delay = 0,
  autoStart = true,
} = {}) => {
  if (typeof end !== "number" || !Number.isFinite(end)) {
    throw new Error('useCounterAnimation: "end" must be a finite number');
  }
  if (typeof start !== "number" || !Number.isFinite(start)) {
    throw new Error('useCounterAnimation: "start" must be a finite number');
  }

  // Validate easing parameter
  const validatedEasing = easingFunctions[easing] ? easing : "linear";
  if (!easingFunctions[easing]) {
    console.warn(
      `useCounterAnimation: Invalid easing "${easing}". Available options: ${Object.keys(
        easingFunctions
      ).join(", ")}. Falling back to "linear".`
    );
  }

  const [count, setCount] = useState(start);
  const [isRunning, setIsRunning] = useState(autoStart);
  const frameIdRef = useRef(null);

  const animate = useCallback(() => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;

      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = easingFunctions[validatedEasing](progress);

      const currentValue = start + (end - start) * easedProgress;
      setCount(Math.round(currentValue * 100) / 100);

      if (progress < 1) {
        frameIdRef.current = requestAnimationFrame(step);
      } else {
        setIsRunning(false);
        frameIdRef.current = null;
      }
    };

    frameIdRef.current = requestAnimationFrame(step);

    return () => {
      // Cleanup function to cancel animation if component unmounts
      if (frameIdRef.current !== null) {
        cancelAnimationFrame(frameIdRef.current);
        frameIdRef.current = null;
      }
    };
  }, [start, end, duration, validatedEasing]);

  useEffect(() => {
    let cleanup;

    if (isRunning) {
      if (delay) {
        const timer = setTimeout(() => {
          cleanup = animate();
        }, delay);
        return () => {
          clearTimeout(timer);
          if (cleanup) cleanup();
        };
      } else {
        cleanup = animate();
        return cleanup;
      }
    }
  }, [isRunning, animate, delay]);

  // Animation controls
  const startAnimation = useCallback(() => {
    setCount(start);
    setIsRunning(true);
  }, [start]);

  const stopAnimation = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    setIsRunning(false);
  }, []);

  const resetAnimation = useCallback(() => {
    if (frameIdRef.current !== null) {
      cancelAnimationFrame(frameIdRef.current);
      frameIdRef.current = null;
    }
    setCount(start);
    setIsRunning(false);
  }, [start]);

  // Format number with commas
  const formattedCount = count.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(count) ? 0 : 2,
    maximumFractionDigits: 2,
  });

  return {
    count,
    formattedCount,
    isRunning,
    actions: {
      start: startAnimation,
      stop: stopAnimation,
      reset: resetAnimation,
    },
  };
};

export default useCounterAnimation;
