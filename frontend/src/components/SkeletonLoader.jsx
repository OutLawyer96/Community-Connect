import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * Skeleton loader component for different content types
 * @param {Object} props - Component props
 * @param {('card'|'list'|'text'|'image')} [props.variant] - Type of skeleton
 * @param {number} [props.lines] - Number of text lines (for text variant)
 * @param {string} [props.width] - Width of the skeleton
 * @param {string} [props.height] - Height of the skeleton
 * @param {string} [props.className] - Additional CSS classes
 */
const SkeletonLoader = ({
  variant = "text",
  lines = 1,
  width = "100%",
  height = "auto",
  className = "",
}) => {
  const shimmerVariants = {
    animate: {
      x: ["0%", "100%"],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  const Shimmer = () => (
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
      variants={shimmerVariants}
      animate="animate"
    />
  );

  const renderSkeleton = () => {
    switch (variant) {
      case "card":
        return (
          <div
            className="overflow-hidden rounded-lg bg-gray-200 dark:bg-gray-700"
            style={{ width, height }}
          >
            {/* Image placeholder */}
            <div className="relative h-48 w-full bg-gray-300 dark:bg-gray-600">
              <Shimmer />
            </div>
            {/* Content placeholder */}
            <div className="p-4 space-y-3">
              <div className="relative h-6 w-2/3 rounded bg-gray-300 dark:bg-gray-600">
                <Shimmer />
              </div>
              <div className="relative h-4 w-full rounded bg-gray-300 dark:bg-gray-600">
                <Shimmer />
              </div>
            </div>
          </div>
        );

      case "list":
        return (
          <div className="space-y-4" style={{ width }}>
            {[...Array(lines)].map((_, i) => (
              <div key={i} className="relative flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600">
                  <Shimmer />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="relative h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600">
                    <Shimmer />
                  </div>
                  <div className="relative h-3 w-1/2 rounded bg-gray-300 dark:bg-gray-600">
                    <Shimmer />
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case "text":
        return (
          <div className="space-y-2" style={{ width }}>
            {[...Array(lines)].map((_, i) => (
              <div
                key={i}
                className="relative h-4 rounded bg-gray-300 dark:bg-gray-600"
                style={{ width: i === lines - 1 ? "75%" : "100%" }}
              >
                <Shimmer />
              </div>
            ))}
          </div>
        );

      case "image":
        return (
          <div
            className="relative rounded bg-gray-300 dark:bg-gray-600"
            style={{ width, height: height === "auto" ? width : height }}
          >
            <Shimmer />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={`overflow-hidden ${className}`}
      role="status"
      aria-label="Loading..."
    >
      {renderSkeleton()}
    </div>
  );
};

SkeletonLoader.propTypes = {
  variant: PropTypes.oneOf(["card", "list", "text", "image"]),
  lines: PropTypes.number,
  width: PropTypes.string,
  height: PropTypes.string,
  className: PropTypes.string,
};

export default SkeletonLoader;
