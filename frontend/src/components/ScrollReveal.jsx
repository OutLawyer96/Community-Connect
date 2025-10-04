import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import PropTypes from "prop-types";

/**
 * ScrollReveal component that animates children when they enter the viewport
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child elements to animate
 * @param {('fade'|'slide'|'scale')} [props.animation] - Type of animation
 * @param {('up'|'down'|'left'|'right')} [props.direction] - Direction of animation
 * @param {number} [props.delay] - Delay before animation starts (in seconds)
 * @param {number} [props.threshold] - Viewport intersection threshold (0-1)
 * @param {string} [props.className] - Additional CSS classes
 */
const ScrollReveal = ({
  children,
  animation = "fade",
  direction = "up",
  delay = 0,
  threshold = 0.1,
  className = "",
}) => {
  const [ref, inView] = useInView({
    threshold,
    triggerOnce: true,
  });

  const variants = {
    fade: {
      hidden: {
        opacity: 0,
        y: direction === "up" ? 20 : direction === "down" ? -20 : 0,
        x: direction === "left" ? 20 : direction === "right" ? -20 : 0,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.6,
          delay,
          ease: [0.6, -0.05, 0.01, 0.99],
        },
      },
    },
    slide: {
      hidden: {
        opacity: 0,
        x: direction === "left" ? 50 : direction === "right" ? -50 : 0,
        y: direction === "up" ? 50 : direction === "down" ? -50 : 0,
      },
      visible: {
        opacity: 1,
        x: 0,
        y: 0,
        transition: {
          duration: 0.6,
          delay,
          ease: [0.6, -0.05, 0.01, 0.99],
        },
      },
    },
    scale: {
      hidden: { opacity: 0, scale: 0.8 },
      visible: {
        opacity: 1,
        scale: 1,
        transition: {
          duration: 0.6,
          delay,
          ease: [0.6, -0.05, 0.01, 0.99],
        },
      },
    },
  };
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={variants[animation]}
    >
      {children}
    </motion.div>
  );
};

ScrollReveal.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf(["fade", "slide", "scale"]),
  direction: PropTypes.oneOf(["up", "down", "left", "right"]),
  delay: PropTypes.number,
  threshold: PropTypes.number,
  className: PropTypes.string,
};

export default ScrollReveal;
