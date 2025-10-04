import React from "react";
import { motion } from "framer-motion";
import { usePageTransition } from "../../hooks/useAnimations";

const AnimatedPage = ({ children, className = "" }) => {
  const { pageVariants } = usePageTransition();

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedPage;
