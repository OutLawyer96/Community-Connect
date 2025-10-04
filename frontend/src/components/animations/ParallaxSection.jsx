import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/**
 * ParallaxSection - Scroll-based parallax effect
 * 
 * Implementation Strategy:
 * - useScroll tracks scroll progress of the component
 * - useTransform maps scroll progress to Y position
 * - Background moves slower (0.5x) than foreground creating depth
 * - Uses transform3d for GPU acceleration
 * 
 * Integration: Use on Home.js landing page
 * Example:
 * <ParallaxSection
 *   backgroundImage="/images/hero-bg.jpg"
 *   speed={0.5}
 * >
 *   <h1>Welcome to Community Connect</h1>
 * </ParallaxSection>
 */
const ParallaxSection = ({
  children,
  backgroundImage,
  speed = 0.5,
  className = "",
  minHeight = "500px",
}) => {
  const ref = useRef(null);

  // Track scroll progress of this specific element
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Transform scroll progress to Y position
  // speed of 0.5 means background moves half as fast as scroll
  // Higher speed = slower movement, creating more depth
  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 100}%`]);
  const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.8, 0.6]);

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${className}`}
      style={{ minHeight }}
    >
      {/* Parallax Background */}
      <motion.div
        style={{
          y,
          opacity,
        }}
        className="absolute inset-0 -z-10"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            height: "120%", // Extend height for parallax effect
            top: "-10%",
          }}
        />
        {/* Optional overlay for better text readability */}
        <div className="absolute inset-0 bg-black/30" />
      </motion.div>

      {/* Foreground Content */}
      <div className="relative z-10 container mx-auto px-4">
        {children}
      </div>
    </div>
  );
};

/**
 * Multi-layer parallax for more complex effects
 */
export const MultiLayerParallax = ({ children, className = "" }) => {
  const ref = useRef(null);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  // Different speeds for different layers
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const y3 = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <div ref={ref} className={`relative min-h-screen overflow-hidden ${className}`}>
      {/* Background Layer (slowest) */}
      <motion.div
        style={{ y: y1 }}
        className="absolute inset-0 -z-30 bg-gradient-to-b from-indigo-900 to-purple-900"
      />

      {/* Middle Layer */}
      <motion.div
        style={{ y: y2 }}
        className="absolute inset-0 -z-20 opacity-30"
      >
        <div className="absolute bottom-0 left-0 right-0 h-96 bg-gradient-to-t from-indigo-500/50 to-transparent" />
      </motion.div>

      {/* Foreground Layer (fastest) */}
      <motion.div
        style={{ y: y3 }}
        className="absolute inset-0 -z-10"
      >
        {/* Add decorative elements here */}
      </motion.div>

      {/* Content (no parallax) */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default ParallaxSection;
