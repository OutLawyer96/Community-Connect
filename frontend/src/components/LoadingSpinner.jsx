import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * LoadingSpinner component with multiple style variants
 * @param {Object} props - Component props
 * @param {('circular'|'dots'|'bars'|'pulse')} [props.type] - Type of spinner
 * @param {('sm'|'md'|'lg')} [props.size] - Size of the spinner
 * @param {string} [props.color] - Primary color of the spinner
 * @param {boolean} [props.overlay] - Whether to show as full-page overlay
 * @param {string} [props.message] - Loading message to display
 * @param {string} [props.className] - Additional CSS classes
 */
const LoadingSpinner = ({
  type = "circular",
  size = "md",
  color = "#4F46E5",
  overlay = false,
  message = "Loading...",
  className = "",
}) => {
  const sizes = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  };

  const spinnerVariants = {
    circular: {
      animate: {
        rotate: 360,
        transition: {
          duration: 1,
          ease: "linear",
          repeat: Infinity,
        },
      },
    },
    dotsContainer: {
      animate: {
        transition: {
          staggerChildren: 0.2,
        },
      },
    },
    dotChild: {
      animate: {
        scale: [1, 1.5, 1],
        transition: {
          duration: 1,
          ease: "easeInOut",
          repeat: Infinity,
        },
      },
    },
    barsContainer: {
      animate: {
        transition: {
          staggerChildren: 0.1,
        },
      },
    },
    barChild: {
      animate: {
        y: [-10, 0, -10],
        transition: {
          duration: 1,
          ease: "easeInOut",
          repeat: Infinity,
        },
      },
    },
    pulse: {
      animate: {
        scale: [1, 1.5, 1],
        opacity: [0.5, 1, 0.5],
        transition: {
          duration: 1.5,
          ease: "easeInOut",
          repeat: Infinity,
        },
      },
    },
  };

  const Spinner = () => {
    switch (type) {
      case "circular":
        return (
          <motion.div
            className={`${sizes[size]} border-4 border-gray-200 border-t-transparent rounded-full`}
            style={{ borderTopColor: color }}
            variants={spinnerVariants.circular}
            animate="animate"
          />
        );
      case "dots":
        return (
          <motion.div
            className="flex space-x-2"
            variants={spinnerVariants.dotsContainer}
            animate="animate"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className={`rounded-full ${sizes[size]}`}
                style={{ backgroundColor: color }}
                variants={spinnerVariants.dotChild}
                animate="animate"
              />
            ))}
          </motion.div>
        );
      case "bars":
        return (
          <motion.div
            className="flex space-x-1"
            variants={spinnerVariants.barsContainer}
            animate="animate"
          >
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className={`w-1.5 ${
                  size === "sm" ? "h-4" : size === "md" ? "h-6" : "h-8"
                }`}
                style={{ backgroundColor: color }}
                variants={spinnerVariants.barChild}
                animate="animate"
              />
            ))}
          </motion.div>
        );
      case "pulse":
        return (
          <motion.div
            className={`${sizes[size]} rounded-full`}
            style={{ backgroundColor: color }}
            variants={spinnerVariants.pulse}
            animate="animate"
          />
        );
      default:
        return null;
    }
  };

  const content = (
    <div
      className={`flex flex-col items-center gap-3 ${className}`}
      role="status"
      aria-live="polite"
      aria-label={message || "Loading"}
    >
      <Spinner />
      {message && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium text-gray-600"
        >
          {message}
        </motion.p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
};

LoadingSpinner.propTypes = {
  type: PropTypes.oneOf(["circular", "dots", "bars", "pulse"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  color: PropTypes.string,
  overlay: PropTypes.bool,
  message: PropTypes.string,
  className: PropTypes.string,
};

export default LoadingSpinner;
