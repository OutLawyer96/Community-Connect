import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useReducedMotion } from "framer-motion";

const AnimationContext = createContext({});

/**
 * Animation preferences and state provider
 * @param {Object} props - Provider props
 * @param {React.ReactNode} props.children - Child elements
 * @param {boolean} [props.defaultEnabled] - Default animation enabled state
 * @param {number} [props.speedMultiplier] - Global animation speed multiplier
 */
export const AnimationProvider = ({
  children,
  defaultEnabled = true,
  speedMultiplier = 1,
}) => {
  const prefersReducedMotion = useReducedMotion();
  const [enabled, setEnabled] = useState(
    defaultEnabled && !prefersReducedMotion
  );
  const [performanceMode, setPerformanceMode] = useState(false);
  const [debug, setDebug] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion) {
      setEnabled(false);
    }
  }, [prefersReducedMotion]);

  // Animation variants map
  const variants = useMemo(
    () => ({
      pageTransition: {
        initial: { opacity: 0, y: 20 },
        animate: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5 * speedMultiplier,
          },
        },
        exit: {
          opacity: 0,
          y: -20,
          transition: {
            duration: 0.3 * speedMultiplier,
          },
        },
      },
      fadeIn: {
        initial: { opacity: 0 },
        animate: {
          opacity: 1,
          transition: {
            duration: 0.3 * speedMultiplier,
          },
        },
      },
    }),
    [speedMultiplier]
  );

  // Global animation queue
  const [animationQueue, setAnimationQueue] = useState([]);
  const [isAnimating, setIsAnimating] = useState(false);

  // Process animation queue
  useEffect(() => {
    if (!isAnimating && animationQueue.length > 0) {
      const nextAnimation = animationQueue[0];
      setIsAnimating(true);

      // Execute animation
      nextAnimation
        .animate()
        .then(() => {
          setAnimationQueue((queue) => queue.slice(1));
          setIsAnimating(false);
        })
        .catch((error) => {
          console.error("Animation error:", error);
          setAnimationQueue((queue) => queue.slice(1));
          setIsAnimating(false);
        });
    }
  }, [animationQueue, isAnimating]);

  // Animation event system
  const listenersRef = useRef({});

  const on = (event, callback) => {
    listenersRef.current = {
      ...listenersRef.current,
      [event]: [...(listenersRef.current[event] || []), callback],
    };

    // Return cleanup function
    return () => {
      listenersRef.current = {
        ...listenersRef.current,
        [event]:
          listenersRef.current[event]?.filter((cb) => cb !== callback) || [],
      };
    };
  };

  const emit = (event, data) => {
    const callbacks = listenersRef.current[event] || [];
    callbacks.forEach((callback) => callback(data));
  };

  // Public context value
  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      performanceMode,
      setPerformanceMode,
      debug,
      setDebug,
      speedMultiplier,
      variants,

      // Queue management
      queueAnimation: (animation) => {
        setAnimationQueue((queue) => [...queue, animation]);
      },
      clearQueue: () => {
        setAnimationQueue([]);
        setIsAnimating(false);
      },

      // Event system
      on,
      emit,

      // Animation utilities
      getTransitionProps: (duration = 0.3) => ({
        transition: {
          duration: enabled ? duration * speedMultiplier : 0,
        },
      }),

      // Debug helpers
      logAnimation: (name, props) => {
        if (debug) {
          console.log(`Animation: ${name}`, props);
        }
      },
    }),
    [enabled, performanceMode, debug, speedMultiplier, variants, on, emit]
  );

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// Custom hook to use animation context
export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error("useAnimation must be used within an AnimationProvider");
  }
  return context;
};

export default AnimationContext;
