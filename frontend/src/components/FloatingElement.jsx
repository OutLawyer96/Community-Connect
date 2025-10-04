import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * FloatingElement component for creating gentle floating animations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {number} [props.amplitude] - Float movement amplitude in pixels
 * @param {number} [props.duration] - Animation duration in seconds
 * @param {number} [props.delay] - Animation delay in seconds
 * @param {('gentle'|'wave'|'circular')} [props.pattern] - Floating pattern type
 * @param {string} [props.className] - Additional CSS classes
 */
const FloatingElement = ({
  children,
  amplitude = 10,
  duration = 3,
  delay = 0,
  pattern = "gentle",
  className = "",
}) => {
  const patterns = {
    gentle: {
      animate: {
        y: [-amplitude, amplitude],
        transition: {
          duration,
          delay,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      },
    },
    wave: {
      animate: {
        y: [-amplitude, amplitude],
        x: [-amplitude / 2, amplitude / 2],
        transition: {
          duration,
          delay,
          repeat: Infinity,
          repeatType: "reverse",
          ease: "easeInOut",
        },
      },
    },
    circular: {
      animate: {
        y: [-amplitude, 0, -amplitude],
        x: [0, amplitude, 0],
        transition: {
          duration,
          delay,
          repeat: Infinity,
          ease: "linear",
        },
      },
    },
  };

  return (
    <motion.div
      className={`will-change-transform ${className}`}
      initial={false}
      animate="animate"
      variants={patterns[pattern]}
    >
      {children}
    </motion.div>
  );
};

FloatingElement.propTypes = {
  children: PropTypes.node.isRequired,
  amplitude: PropTypes.number,
  duration: PropTypes.number,
  delay: PropTypes.number,
  pattern: PropTypes.oneOf(["gentle", "wave", "circular"]),
  className: PropTypes.string,
};

export default FloatingElement;
