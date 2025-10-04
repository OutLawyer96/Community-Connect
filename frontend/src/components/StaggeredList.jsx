import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * StaggeredList component for animated list reveals
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - List items to animate
 * @param {number} [props.staggerDelay] - Delay between each item
 * @param {('up'|'down'|'left'|'right')} [props.direction] - Animation direction
 * @param {number} [props.threshold] - Viewport intersection threshold
 * @param {string} [props.className] - Additional CSS classes
 */
const StaggeredList = ({
  children,
  staggerDelay = 0.1,
  direction = "up",
  threshold = 0.1,
  className = "",
}) => {
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.2,
      },
    },
  };

  const getItemVariants = () => {
    const variants = {
      up: {
        hidden: { y: 20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      },
      down: {
        hidden: { y: -20, opacity: 0 },
        visible: { y: 0, opacity: 1 },
      },
      left: {
        hidden: { x: 20, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      },
      right: {
        hidden: { x: -20, opacity: 0 },
        visible: { x: 0, opacity: 1 },
      },
    };

    return {
      ...variants[direction],
      visible: {
        ...variants[direction].visible,
        transition: {
          duration: 0.5,
          ease: [0.6, -0.05, 0.01, 0.99],
        },
      },
    };
  };

  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: threshold }}
      variants={containerVariants}
    >
      {Array.isArray(children) ? (
        children.map((child, index) => (
          <motion.div key={index} variants={getItemVariants()}>
            {child}
          </motion.div>
        ))
      ) : (
        <motion.div variants={getItemVariants()}>{children}</motion.div>
      )}
    </motion.div>
  );
};

StaggeredList.propTypes = {
  children: PropTypes.node.isRequired,
  staggerDelay: PropTypes.number,
  direction: PropTypes.oneOf(["up", "down", "left", "right"]),
  threshold: PropTypes.number,
  className: PropTypes.string,
};

export default StaggeredList;
