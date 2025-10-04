import React from "react";
import { motion } from "framer-motion";
import { useStaggeredReveal } from "../../hooks/useAnimations";

const StaggeredList = ({ children, staggerDelay = 0.1, className = "" }) => {
  const { ref, inView, variants, containerVariants } = useStaggeredReveal(
    React.Children.count(children),
    staggerDelay
  );

  return (
    <motion.div
      ref={ref}
      variants={containerVariants}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div custom={i} variants={variants} className="w-full">
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
};

export default StaggeredList;
