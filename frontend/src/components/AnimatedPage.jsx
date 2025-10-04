import { motion } from "framer-motion";
import PropTypes from "prop-types";

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.6, -0.05, 0.01, 0.99],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
    },
  },
};

/**
 * AnimatedPage component that provides consistent page transition animations
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {string} [props.className] - Additional CSS classes to apply
 */
const AnimatedPage = ({ children, className = "" }) => {
  return (
    <motion.div
      className={className}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
};

AnimatedPage.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
};

export default AnimatedPage;
