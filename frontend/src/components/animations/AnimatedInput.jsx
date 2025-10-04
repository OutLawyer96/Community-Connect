import React, { useState } from "react";
import { motion } from "framer-motion";

/**
 * AnimatedInput - Floating label input with smooth animations
 * 
 * Implementation Strategy:
 * - Uses Framer Motion to animate label position and scale
 * - Tracks focus state and value to determine label position
 * - Bottom border animates from left to right on focus
 * - Label moves up and scales down when input is focused or has value
 * 
 * Integration: Replace standard inputs in Login.js and Register.js
 * Example: <AnimatedInput label="Email" type="email" value={email} onChange={setEmail} />
 */
const AnimatedInput = ({
  label,
  type = "text",
  value,
  onChange,
  error,
  className = "",
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  
  // Label should be "floating" if input is focused or has a value
  const isFloating = isFocused || value;

  const labelVariants = {
    default: {
      y: 0,
      scale: 1,
      color: "rgba(107, 114, 128, 1)", // gray-500
    },
    floating: {
      y: -28,
      scale: 0.85,
      color: "rgba(99, 102, 241, 1)", // primary color (indigo-500)
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 20,
      },
    },
  };

  const borderVariants = {
    default: {
      scaleX: 0,
      transition: {
        duration: 0.2,
      },
    },
    focused: {
      scaleX: 1,
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  return (
    <div className={`relative mb-6 ${className}`}>
      {/* Input Field */}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={`
          w-full px-0 py-2 bg-transparent border-0 border-b-2 border-gray-300
          text-gray-900 placeholder-transparent focus:outline-none focus:ring-0
          transition-colors duration-200
          ${error ? "border-red-500" : ""}
        `}
        placeholder={label}
        {...props}
      />

      {/* Animated Label */}
      <motion.label
        variants={labelVariants}
        initial="default"
        animate={isFloating ? "floating" : "default"}
        className="absolute left-0 top-2 origin-left cursor-text pointer-events-none"
      >
        {label}
      </motion.label>

      {/* Animated Bottom Border */}
      <motion.div
        variants={borderVariants}
        initial="default"
        animate={isFocused ? "focused" : "default"}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 origin-left"
      />

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};

export default AnimatedInput;
