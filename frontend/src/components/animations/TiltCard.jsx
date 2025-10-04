import React, { useRef } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

/**
 * TiltCard - 3D tilt effect based on mouse position
 *
 * Implementation Strategy:
 * - useMotionValue tracks mouse X and Y without re-renders
 * - useTransform maps mouse position to rotation values
 * - useSpring adds smooth physics-based interpolation
 * - transform-style: preserve-3d enables 3D space
 * - rotateX/Y create the tilt effect
 *
 * Integration: Wrap ProviderCard.js or any card component
 * Example:
 * <TiltCard>
 *   <ProviderCard {...provider} />
 * </TiltCard>
 */
const TiltCard = ({
  children,
  className = "",
  tiltMaxAngle = 15,
  scale = 1.05,
}) => {
  const ref = useRef(null);

  // Motion values for mouse position (0 to 1)
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  // Spring config for smooth, responsive animation
  const springConfig = { stiffness: 150, damping: 15 };

  // Transform mouse position to rotation angles
  // Map 0-1 to -tiltMaxAngle to +tiltMaxAngle
  const rotateX = useSpring(
    useTransform(y, [0, 1], [tiltMaxAngle, -tiltMaxAngle]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(x, [0, 1], [-tiltMaxAngle, tiltMaxAngle]),
    springConfig
  );

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    // Calculate mouse position relative to card (0 to 1)
    const mouseX = (e.clientX - rect.left) / width;
    const mouseY = (e.clientY - rect.top) / height;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    // Return to center position
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale }}
      transition={{ type: "spring", stiffness: 300 }}
      className={`${className}`}
    >
      {/* Inner content with slight translation for depth */}
      <div style={{ transform: "translateZ(20px)" }}>{children}</div>
    </motion.div>
  );
};

/**
 * Enhanced TiltCard with shine effect
 */
export const TiltCardWithShine = ({
  children,
  className = "",
  tiltMaxAngle = 15,
}) => {
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springConfig = { stiffness: 150, damping: 15 };

  const rotateX = useSpring(
    useTransform(y, [0, 1], [tiltMaxAngle, -tiltMaxAngle]),
    springConfig
  );
  const rotateY = useSpring(
    useTransform(x, [0, 1], [-tiltMaxAngle, tiltMaxAngle]),
    springConfig
  );

  // Shine effect based on mouse position
  const shineX = useSpring(
    useTransform(x, [0, 1], ["0%", "100%"]),
    springConfig
  );
  const shineY = useSpring(
    useTransform(y, [0, 1], ["0%", "100%"]),
    springConfig
  );

  const handleMouseMove = (e) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / rect.width;
    const mouseY = (e.clientY - rect.top) / rect.height;

    x.set(mouseX);
    y.set(mouseY);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      whileHover={{ scale: 1.05 }}
      className={`relative ${className}`}
    >
      {/* Shine overlay */}
      <motion.div
        style={{
          background: `radial-gradient(circle at ${shineX} ${shineY}, rgba(255,255,255,0.3) 0%, transparent 50%)`,
        }}
        className="absolute inset-0 pointer-events-none rounded-lg"
      />

      {/* Content */}
      <div style={{ transform: "translateZ(20px)" }}>{children}</div>
    </motion.div>
  );
};

/**
 * Example usage with a card
 */
export const TiltCardExample = () => {
  return (
    <TiltCard className="max-w-sm">
      <div className="bg-white rounded-lg shadow-xl p-6">
        <img
          src="/api/placeholder/400/200"
          alt="Provider"
          className="w-full h-48 object-cover rounded-lg mb-4"
        />
        <h3 className="text-2xl font-bold text-gray-900">Dr. Jane Smith</h3>
        <p className="text-gray-600 mt-2">Cardiologist</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-indigo-600 font-semibold">★ 4.9</span>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            View Profile
          </button>
        </div>
      </div>
    </TiltCard>
  );
};

export default TiltCard;
