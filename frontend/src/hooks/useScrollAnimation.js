import { useInView } from "react-intersection-observer";
import { useEffect, useCallback, useState } from "react";
import { useAnimationControls } from "framer-motion";

/**
 * Custom hook for scroll-based animations
 * @param {Object} options - Hook options
 * @param {number} [options.threshold] - Intersection threshold (0-1)
 * @param {string} [options.rootMargin] - Root margin for intersection
 * @param {boolean} [options.triggerOnce] - Trigger animation only once
 * @param {Function} [options.onEnter] - Callback when element enters viewport
 * @param {Function} [options.onLeave] - Callback when element leaves viewport
 * @returns {Object} Animation controls and ref
 */
const useScrollAnimation = ({
  threshold = 0.1,
  rootMargin = "0px",
  triggerOnce = true,
  onEnter,
  onLeave,
} = {}) => {
  const [ref, inView] = useInView({
    threshold,
    rootMargin,
    triggerOnce,
  });

  const controls = useAnimationControls();

  useEffect(() => {
    if (inView) {
      controls.start("visible");
      onEnter?.();
    } else if (!triggerOnce) {
      controls.start("hidden");
      onLeave?.();
    }
  }, [inView, controls, triggerOnce, onEnter, onLeave]);

  // Calculate scroll progress
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollProgress = useCallback(() => {
    if (!ref.current) return;

    const element = ref.current;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    // Calculate how far through the element we've scrolled
    const progress = 1 - rect.bottom / (windowHeight + rect.height);
    setScrollProgress(Math.min(Math.max(progress, 0), 1));
  }, [ref]);

  useEffect(() => {
    if (!ref.current) return;

    window.addEventListener("scroll", updateScrollProgress);
    updateScrollProgress(); // Initial calculation

    return () => window.removeEventListener("scroll", updateScrollProgress);
  }, [ref, updateScrollProgress]);

  return {
    ref,
    inView,
    controls,
    scrollProgress,
  };
};

export default useScrollAnimation;
