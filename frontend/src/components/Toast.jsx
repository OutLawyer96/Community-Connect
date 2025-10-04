import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

/**
 * Toast notification component with smooth animations
 * @param {Object} props - Component props
 * @param {string} props.message - Toast message
 * @param {('success'|'error'|'warning'|'info')} [props.type] - Toast type
 * @param {number} [props.duration] - Duration in ms before auto-dismiss
 * @param {('top'|'bottom')} [props.position] - Toast position
 * @param {Function} [props.onClose] - Callback when toast is closed
 * @param {boolean} [props.showProgress] - Show progress bar
 */
const Toast = ({
  message,
  type = "info",
  duration = 3000,
  position = "top",
  onClose,
  showProgress = true,
}) => {
  const [portalContainer, setPortalContainer] = useState(null);

  useEffect(() => {
    // Create portal container if it doesn't exist
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = `fixed ${position}-0 left-0 right-0 z-50 flex flex-col items-center p-4 pointer-events-none`;
      document.body.appendChild(container);
    }
    setPortalContainer(container);

    // Start auto-dismiss timer
    const timer = setTimeout(() => {
      onClose?.();
    }, duration);

    return () => {
      clearTimeout(timer);
      // Remove container if it's empty
      if (container.childNodes.length === 0) {
        document.body.removeChild(container);
      }
    };
  }, [duration, onClose, position]);

  if (!portalContainer) return null;

  const colors = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500",
    info: "bg-blue-500",
  };

  const icons = {
    success: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 13l4 4L19 7"
        />
      </svg>
    ),
    error: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    ),
    warning: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
    info: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  };

  const toastVariants = {
    initial: {
      opacity: 0,
      y: position === "top" ? -20 : 20,
      scale: 0.8,
    },
    animate: {
      opacity: 1,
      y: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      transition: { duration: 0.2 },
    },
  };

  const progressVariants = {
    initial: { width: "100%" },
    animate: { width: "0%" },
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="pointer-events-auto max-w-sm rounded-lg shadow-lg"
        variants={toastVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        layout
      >
        <div
          className={`flex items-center p-4 ${colors[type]} text-white rounded-t-lg`}
        >
          <span className="flex-shrink-0">{icons[type]}</span>
          <p className="ml-3 mr-8 text-sm font-medium">{message}</p>
          <button
            onClick={onClose}
            className="ml-auto -mr-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 hover:bg-white/30"
          >
            <span className="sr-only">Close</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        {showProgress && (
          <motion.div
            className={`h-1 ${colors[type]} rounded-b-lg`}
            variants={progressVariants}
            initial="initial"
            animate="animate"
            transition={{ duration: duration / 1000, ease: "linear" }}
          />
        )}
      </motion.div>
    </AnimatePresence>,
    portalContainer
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  type: PropTypes.oneOf(["success", "error", "warning", "info"]),
  duration: PropTypes.number,
  position: PropTypes.oneOf(["top", "bottom"]),
  onClose: PropTypes.func,
  showProgress: PropTypes.bool,
};

export default Toast;
