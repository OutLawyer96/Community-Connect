import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useState } from "react";

/**
 * Animated input component with floating label and validation states
 * @param {Object} props - Component props
 * @param {string} props.label - Input label
 * @param {string} [props.type] - Input type
 * @param {string} [props.value] - Input value
 * @param {Function} props.onChange - Change handler
 * @param {boolean} [props.error] - Error state
 * @param {string} [props.helperText] - Helper/error text
 * @param {string} [props.className] - Additional CSS classes
 */
const Input = ({
  label,
  type = "text",
  value = "",
  onChange,
  error = false,
  helperText = "",
  className = "",
  ...props
}) => {
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const hasValue = value !== "";

  const labelVariants = {
    rest: {
      y: hasValue || focused ? -24 : 0,
      scale: hasValue || focused ? 0.85 : 1,
      color: error ? "#EF4444" : focused ? "#4F46E5" : "#6B7280",
    },
  };

  const borderVariants = {
    rest: {
      scaleX: 0,
    },
    focus: {
      scaleX: 1,
    },
  };

  const errorShakeVariants = {
    shake: {
      x: [-10, 10, -10, 10, 0],
      transition: { duration: 0.4 },
    },
  };

  return (
    <div className={`relative ${className}`}>
      {/* Input container */}
      <motion.div
        className="relative"
        variants={errorShakeVariants}
        animate={error ? "shake" : undefined}
      >
        {/* Floating label */}
        <motion.label
          className="absolute left-3 pointer-events-none origin-left"
          style={{ top: "50%", transform: "translateY(-50%)" }}
          variants={labelVariants}
          animate="rest"
          transition={{ duration: 0.2 }}
        >
          {label}
        </motion.label>

        {/* Input field */}
        <input
          type={type === "password" && showPassword ? "text" : type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          className={`
            w-full px-3 py-2 bg-white rounded-lg border-2 transition-colors
            focus:outline-none
            ${
              error
                ? "border-red-500 focus:border-red-500"
                : "border-gray-300 focus:border-indigo-500"
            }
          `}
          {...props}
        />

        {/* Animated focus border */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-500 origin-left"
          variants={borderVariants}
          animate={focused ? "focus" : "rest"}
          initial="rest"
          transition={{ duration: 0.2 }}
        />

        {/* Password toggle button */}
        {type === "password" && value && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? (
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
            ) : (
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
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                />
              </svg>
            )}
          </button>
        )}
      </motion.div>

      {/* Helper/Error text */}
      <AnimatedHelperText show={!!helperText} error={error}>
        {helperText}
      </AnimatedHelperText>
    </div>
  );
};

const AnimatedHelperText = ({ show, error, children }) => (
  <motion.div
    initial={false}
    animate={{
      height: show ? "auto" : 0,
      opacity: show ? 1 : 0,
    }}
    transition={{ duration: 0.2 }}
    className="overflow-hidden"
  >
    <p className={`mt-1 text-sm ${error ? "text-red-500" : "text-gray-500"}`}>
      {children}
    </p>
  </motion.div>
);

AnimatedHelperText.propTypes = {
  show: PropTypes.bool.isRequired,
  error: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

Input.propTypes = {
  label: PropTypes.string.isRequired,
  type: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.bool,
  helperText: PropTypes.string,
  className: PropTypes.string,
};

export default Input;
