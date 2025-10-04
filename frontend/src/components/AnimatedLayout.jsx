import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useAnimation } from "../contexts/AnimationContext";

/**
 * @typedef {Object} AnimatedLayoutProps
 * @property {React.ReactNode} children - The content to be rendered within the layout
 * @property {string} [className] - Additional CSS classes for the layout
 */

/**
 * AnimatedLayout component provides a consistent animation wrapper for page transitions
 * and layout animations throughout the application.
 *
 * @param {AnimatedLayoutProps} props
 */
const AnimatedLayout = ({ children, className = "" }) => {
  const { enabled: animationEnabled, getTransitionProps } = useAnimation();
  const transitionDuration = 0.3; // Default duration

  const layoutVariants = {
    initial: {
      opacity: 0,
      y: 20,
    },
    animate: {
      opacity: 1,
      y: 0,
      transition: {
        duration: transitionDuration,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      y: -20,
      transition: {
        duration: transitionDuration * 0.75,
        ease: "easeIn",
      },
    },
  };

  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={animationEnabled ? layoutVariants : {}}
        initial={animationEnabled ? "initial" : false}
        animate={animationEnabled ? "animate" : false}
        exit={animationEnabled ? "exit" : false}
        className={`min-h-screen ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedLayout;
