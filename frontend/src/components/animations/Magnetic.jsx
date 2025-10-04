import React, { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";

/**
 * Magnetic - Wrapper component with magnetic attraction effect
 * 
 * Implementation Strategy:
 * - useSpring creates smooth physics-based animations
 * - Calculates mouse distance from element center
 * - Translates element towards cursor within a radius
 * - Returns to origin when mouse leaves or moves too far
 * - High stiffness (150) and low damping (15) for snappy feel
 * 
 * Integration: Wrap buttons, links, or cards
 * Example:
 * <Magnetic>
 *   <button className="px-6 py-3 bg-indigo-600 text-white rounded-lg">
 *     Get Started
 *   </button>
 * </Magnetic>
 */
const Magnetic = ({
  children,
  strength = 0.3,
  radius = 100,
  className = "",
}) => {
  const ref = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  // Spring animations for smooth, physics-based movement
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Calculate distance from cursor to element center
    const distanceX = e.clientX - centerX;
    const distanceY = e.clientY - centerY;
    const distance = Math.sqrt(distanceX ** 2 + distanceY ** 2);

    // Only apply magnetic effect within radius
    if (distance < radius) {
      setIsHovered(true);
      
      // Apply magnetic pull with strength modifier
      // Closer to center = stronger pull
      const pullStrength = (1 - distance / radius) * strength;
      x.set(distanceX * pullStrength);
      y.set(distanceY * pullStrength);
    } else {
      setIsHovered(false);
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={`inline-block ${className}`}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </motion.div>
  );
};

/**
 * MagneticCard - Pre-configured magnetic card component
 */
export const MagneticCard = ({ children, className = "" }) => {
  return (
    <Magnetic strength={0.2} radius={120}>
      <motion.div
        className={`relative ${className}`}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {children}
      </motion.div>
    </Magnetic>
  );
};

/**
 * MagneticButton - Pre-configured magnetic button component
 */
export const MagneticButton = ({ children, onClick, className = "" }) => {
  return (
    <Magnetic strength={0.4} radius={80}>
      <motion.button
        onClick={onClick}
        className={`px-6 py-3 rounded-lg font-medium transition-colors ${className}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {children}
      </motion.button>
    </Magnetic>
  );
};

export default Magnetic;
