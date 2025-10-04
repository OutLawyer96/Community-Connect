import React from "react";
import { motion } from "framer-motion";
import { useScrollReveal } from "../../hooks/useAnimations";

const ScrollReveal = ({ children, className = "", threshold = 0.1 }) => {
  const { ref, inView } = useScrollReveal(threshold);

  const variants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return (
    <motion.div
      ref={ref}
      variants={variants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
