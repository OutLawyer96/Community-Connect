import { useState, useEffect, useCallback } from "react";
import { useAnimationControls } from "framer-motion";

/**
 * Custom hook for hover-based animations
 * @param {Object} options - Hook options
 * @param {number} [options.hoverDelay] - Delay before hover effect (ms)
 * @param {number} [options.followSpeed] - Speed of magnetic effect (0-1)
 * @param {boolean} [options.magneticEffect] - Enable magnetic cursor effect
 * @returns {Object} Hover state and controls
 */
const useHoverAnimation = ({
  hoverDelay = 0,
  followSpeed = 0.3,
  magneticEffect = false,
} = {}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [elementPosition, setElementPosition] = useState({ x: 0, y: 0 });
  const controls = useAnimationControls();

  const handleMouseEnter = useCallback(() => {
    if (hoverDelay) {
      setTimeout(() => setIsHovered(true), hoverDelay);
    } else {
      setIsHovered(true);
    }
  }, [hoverDelay]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (magneticEffect) {
      controls.start({ x: 0, y: 0 });
    }
  }, [magneticEffect, controls]);

  const handleMouseMove = useCallback(
    (event, element) => {
      if (!magneticEffect || !element) return;

      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left - rect.width / 2;
      const y = event.clientY - rect.top - rect.height / 2;

      setMousePosition({ x, y });
    },
    [magneticEffect]
  );

  // Magnetic follow effect
  useEffect(() => {
    if (!magneticEffect || !isHovered) return;

    const followMouse = () => {
      setElementPosition((prev) => ({
        x: prev.x + (mousePosition.x - prev.x) * followSpeed,
        y: prev.y + (mousePosition.y - prev.y) * followSpeed,
      }));
    };

    const animationFrame = requestAnimationFrame(followMouse);
    return () => cancelAnimationFrame(animationFrame);
  }, [magneticEffect, isHovered, mousePosition, followSpeed]);

  // Update animation controls
  useEffect(() => {
    if (magneticEffect && isHovered) {
      controls.start({
        x: elementPosition.x,
        y: elementPosition.y,
        transition: { type: "spring", stiffness: 350, damping: 25 },
      });
    }
  }, [controls, magneticEffect, isHovered, elementPosition]);

  return {
    isHovered,
    mousePosition: elementPosition,
    handlers: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onMouseMove: handleMouseMove,
    },
    controls,
  };
};

export default useHoverAnimation;
