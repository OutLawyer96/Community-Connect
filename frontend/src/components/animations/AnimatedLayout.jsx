import React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * @typedef {Object} AnimatedLayoutProps
 * @property {React.ReactNode} children - Child components to animate
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Wrapper component that provides page transition animations
 *
 * @param {AnimatedLayoutProps} props
 */
const AnimatedLayout = ({ children, className = "" }) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 20 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`min-h-screen ${className}`}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default AnimatedLayout;
