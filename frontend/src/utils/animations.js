import { useSpring, animated } from "@react-spring/web";
import { useInView } from "react-intersection-observer";

// Fade in animation hook
export const useFadeIn = (delay = 0) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const props = useSpring({
    from: { opacity: 0, transform: "translateY(20px)" },
    to: {
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0px)" : "translateY(20px)",
    },
    delay,
    config: { tension: 280, friction: 60 },
  });

  return [ref, props];
};

// Scale animation hook
export const useScale = (delay = 0) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const props = useSpring({
    from: { transform: "scale(0.8)", opacity: 0 },
    to: {
      transform: inView ? "scale(1)" : "scale(0.8)",
      opacity: inView ? 1 : 0,
    },
    delay,
    config: { tension: 300, friction: 40 },
  });

  return [ref, props];
};

// Slide in animation hook
export const useSlideIn = (direction = "left", delay = 0) => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const props = useSpring({
    from: {
      transform:
        direction === "left"
          ? "translateX(-100px)"
          : direction === "right"
          ? "translateX(100px)"
          : "translateY(100px)",
      opacity: 0,
    },
    to: {
      transform: inView
        ? "translate(0px)"
        : direction === "left"
        ? "translateX(-100px)"
        : direction === "right"
        ? "translateX(100px)"
        : "translateY(100px)",
      opacity: inView ? 1 : 0,
    },
    delay,
    config: { tension: 280, friction: 60 },
  });

  return [ref, props];
};

// Stagger animation hook for lists
export const useStaggeredList = (items, baseDelay = 100) => {
  const [ref] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  return items.map((item, index) => {
    const props = useSpring({
      from: { opacity: 0, transform: "translateY(20px)" },
      to: { opacity: 1, transform: "translateY(0px)" },
      delay: index * baseDelay,
      config: { tension: 280, friction: 60 },
    });
    return { ref, props, item };
  });
};

// Hover animation styles
export const hoverScale = {
  scale: 1.05,
  transition: {
    type: "spring",
    stiffness: 300,
    damping: 10,
  },
};

// Page transition animation
export const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: {
    type: "spring",
    stiffness: 260,
    damping: 20,
  },
};

// Pulse animation for notifications
export const usePulse = () => {
  const props = useSpring({
    from: { transform: "scale(1)" },
    to: [{ transform: "scale(1.1)" }, { transform: "scale(1)" }],
    config: { tension: 300, friction: 10 },
    loop: true,
  });

  return props;
};

// Shimmer loading animation
export const shimmer = {
  hidden: { opacity: 0.3 },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.6,
      repeat: Infinity,
      repeatType: "reverse",
    },
  },
};
