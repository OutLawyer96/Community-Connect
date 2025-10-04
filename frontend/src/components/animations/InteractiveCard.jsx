import React from "react";
import { motion } from "framer-motion";

const InteractiveCard = ({ children, className = "", onClick, href }) => {
  const variants = {
    initial: { scale: 1 },
    hover: {
      scale: 1.02,
      boxShadow:
        "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
    },
    tap: { scale: 0.98 },
  };

  const Component = href ? motion.a : motion.div;
  const props = href ? { href } : { onClick };

  return (
    <Component
      {...props}
      variants={variants}
      initial="initial"
      whileHover="hover"
      whileTap="tap"
      className={`transform transition-all duration-200 ${className}`}
    >
      {children}
    </Component>
  );
};

export default InteractiveCard;
