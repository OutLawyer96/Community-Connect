import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useState } from "react";

/**
 * Interactive card component with hover effects and animations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Card content
 * @param {('elevated'|'flat'|'outlined')} [props.variant] - Card variant
 * @param {('sm'|'md'|'lg')} [props.elevation] - Elevation/shadow size
 * @param {boolean} [props.interactive] - Enable hover animations
 * @param {boolean} [props.loading] - Loading state
 * @param {string} [props.className] - Additional CSS classes
 */
const InteractiveCard = ({
  children,
  variant = "elevated",
  elevation = "md",
  interactive = true,
  loading = false,
  className = "",
  ...props
}) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Elevation styles
  const elevationClasses = {
    elevated: {
      sm: "shadow-md hover:shadow-lg",
      md: "shadow-lg hover:shadow-xl",
      lg: "shadow-xl hover:shadow-2xl",
    },
    flat: {
      sm: "hover:shadow-sm",
      md: "hover:shadow",
      lg: "hover:shadow-md",
    },
    outlined: {
      sm: "border hover:shadow-sm",
      md: "border hover:shadow",
      lg: "border hover:shadow-md",
    },
  };

  // Animation variants
  const cardVariants = {
    initial: {
      scale: 1,
      boxShadow: elevationClasses[variant][elevation],
    },
    hover: {
      scale: interactive ? 1.02 : 1,
      y: interactive ? -4 : 0,
    },
    tap: {
      scale: interactive ? 0.98 : 1,
    },
  };

  // Handle mouse move for tilt effect
  const handleMouseMove = (e) => {
    if (!interactive) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setMousePosition({ x, y });
  };

  // Calculate tilt transform
  const getTiltTransform = () => {
    if (!interactive) return {};

    const tiltX = (mousePosition.y - 0.5) * 10;
    const tiltY = (mousePosition.x - 0.5) * -10;
    return {
      transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
    };
  };

  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-lg bg-white transition-all duration-300
        ${elevationClasses[variant][elevation]}
        ${interactive ? "cursor-pointer" : ""}
        ${className}
      `}
      variants={cardVariants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      onMouseMove={handleMouseMove}
      style={getTiltTransform()}
      {...props}
    >
      {/* Loading overlay */}
      {loading && (
        <motion.div
          className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="flex h-full items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          </div>
        </motion.div>
      )}

      {/* Hover gradient border */}
      {interactive && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 0.1 }}
          style={{
            background: "linear-gradient(45deg, #4F46E5, #7C3AED, #2563EB)",
            backgroundSize: "200% 200%",
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatType: "reverse",
          }}
        />
      )}

      {/* Card content */}
      <div className="relative z-0">{children}</div>
    </motion.div>
  );
};

InteractiveCard.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["elevated", "flat", "outlined"]),
  elevation: PropTypes.oneOf(["sm", "md", "lg"]),
  interactive: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default InteractiveCard;
