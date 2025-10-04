import React from "react";
import { motion } from "framer-motion";

/**
 * AnimatedSVG - SVG path drawing animation
 *
 * Implementation Strategy:
 * - Uses stroke-dasharray and stroke-dashoffset for drawing effect
 * - pathLength property animates from 0 to 1
 * - Can animate multiple paths with stagger delay
 * - Works with any SVG path element
 *
 * Integration: Use for logo animations, icons, or decorative elements
 * Example:
 * <AnimatedSVG
 *   paths={logoPathData}
 *   viewBox="0 0 100 100"
 *   strokeWidth={2}
 * />
 */
const AnimatedSVG = ({
  paths,
  viewBox = "0 0 100 100",
  strokeWidth = 2,
  strokeColor = "#4F46E5",
  fillColor = "none",
  duration = 2,
  delay = 0,
  className = "",
}) => {
  // Path variants for drawing animation
  const pathVariants = {
    hidden: {
      pathLength: 0,
      opacity: 0,
    },
    visible: (custom) => ({
      pathLength: 1,
      opacity: 1,
      transition: {
        pathLength: {
          delay: delay + custom * 0.5,
          duration: duration,
          ease: "easeInOut",
        },
        opacity: {
          delay: delay + custom * 0.5,
          duration: 0.3,
        },
      },
    }),
  };

  // Convert single path to array
  const pathsArray = Array.isArray(paths) ? paths : [paths];

  return (
    <svg
      viewBox={viewBox}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {pathsArray.map((pathData, index) => (
        <motion.path
          key={index}
          d={pathData}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill={fillColor}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={pathVariants}
          initial="hidden"
          animate="visible"
          custom={index}
        />
      ))}
    </svg>
  );
};

/**
 * Pre-made animated logo examples
 */
export const AnimatedLogoExample = () => {
  // Example: Simple heart logo
  const heartPath =
    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";

  return (
    <AnimatedSVG
      paths={heartPath}
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeColor="#EF4444"
      className="w-24 h-24"
    />
  );
};

/**
 * Animated checkmark for success states
 */
export const AnimatedCheckmark = ({ size = 64 }) => {
  const checkmarkPath = "M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z";

  return (
    <AnimatedSVG
      paths={checkmarkPath}
      viewBox="0 0 24 24"
      strokeWidth={3}
      strokeColor="#10B981"
      fillColor="none"
      duration={0.6}
      className={`w-${size} h-${size}`}
    />
  );
};

/**
 * Multi-path logo example (Community Connect logo concept)
 */
export const CommunityConnectLogo = () => {
  const paths = [
    // Circle
    "M50 10 A40 40 0 1 1 50 90 A40 40 0 1 1 50 10",
    // Connect line
    "M30 50 L70 50",
    // Left person
    "M35 40 Q30 35 25 40 L25 50 Q30 55 35 50 Z",
    // Right person
    "M65 40 Q70 35 75 40 L75 50 Q70 55 65 50 Z",
  ];

  return (
    <AnimatedSVG
      paths={paths}
      viewBox="0 0 100 100"
      strokeWidth={2}
      strokeColor="#4F46E5"
      duration={1.5}
      className="w-32 h-32"
    />
  );
};

export default AnimatedSVG;
