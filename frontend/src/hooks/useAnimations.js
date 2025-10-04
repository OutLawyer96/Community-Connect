import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export const useScrollReveal = (threshold = 0.1, triggerOnce = true) => {
  const [ref, inView] = useInView({
    threshold,
    triggerOnce,
  });

  return { ref, inView };
};

export const useStaggeredReveal = (itemCount, staggerDelay = 0.1) => {
  const [ref, inView] = useInView({
    threshold: 0.1,
    triggerOnce: true,
  });

  const variants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * staggerDelay,
        duration: 0.5,
        ease: "easeOut",
      },
    }),
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1,
      },
    },
  };

  return { ref, inView, variants, containerVariants };
};

export const usePageTransition = () => {
  const pageVariants = {
    initial: {
      opacity: 0,
      x: -20,
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      x: 20,
      transition: {
        duration: 0.3,
        ease: "easeIn",
      },
    },
  };

  return { pageVariants };
};

export const useSectionTransition = () => {
  const sectionVariants = {
    hidden: {
      opacity: 0,
      y: 30,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  return { sectionVariants };
};
