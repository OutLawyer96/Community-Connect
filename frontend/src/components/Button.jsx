import { motion } from "framer-motion";
import PropTypes from "prop-types";

/**
 * Enhanced button component with micro-interactions
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content
 * @param {('primary'|'secondary'|'outline'|'ghost')} [props.variant] - Button variant
 * @param {('sm'|'md'|'lg')} [props.size] - Button size
 * @param {boolean} [props.loading] - Loading state
 * @param {boolean} [props.disabled] - Disabled state
 * @param {boolean} [props.fullWidth] - Full width button
 * @param {Function} [props.onClick] - Click handler
 * @param {string} [props.className] - Additional CSS classes
 */
const Button = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  fullWidth = false,
  onClick,
  className = "",
  ...props
}) => {
  const baseClasses = {
    primary:
      "bg-indigo-600 text-white hover:bg-indigo-500 active:bg-indigo-700",
    secondary: "bg-gray-100 text-gray-900 hover:bg-gray-200 active:bg-gray-300",
    outline:
      "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100",
    ghost: "text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  const buttonVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.02 },
    tap: { scale: 0.98 },
    disabled: { opacity: 0.6 },
  };

  return (
    <motion.button
      className={`
        relative inline-flex items-center justify-center rounded-lg font-medium transition-colors
        focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        disabled:cursor-not-allowed disabled:opacity-60
        ${baseClasses[variant]}
        ${sizeClasses[size]}
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
      variants={buttonVariants}
      initial="initial"
      whileHover={!disabled && !loading ? "hover" : ""}
      whileTap={!disabled && !loading ? "tap" : ""}
      animate={disabled ? "disabled" : "initial"}
      onClick={!disabled && !loading ? onClick : undefined}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading spinner */}
      {loading && (
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <svg
            className="h-5 w-5 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        </motion.div>
      )}

      {/* Button content */}
      <motion.span
        animate={{ opacity: loading ? 0 : 1 }}
        transition={{ duration: 0.2 }}
      >
        {children}
      </motion.span>

      {/* Ripple effect */}
      <span className="absolute inset-0 overflow-hidden rounded-lg">
        <motion.span
          className="absolute inset-0 rounded-lg bg-current"
          initial={{ scale: 0, opacity: 0.35 }}
          animate={{ scale: 0, opacity: 0 }}
          whileTap={{ scale: 1.5, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </span>
    </motion.button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(["primary", "secondary", "outline", "ghost"]),
  size: PropTypes.oneOf(["sm", "md", "lg"]),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default Button;
