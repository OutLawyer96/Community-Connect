import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useScrollAnimation } from "../hooks/useScrollAnimation";
import { useHoverAnimation } from "../hooks/useHoverAnimation";

/**
 * @typedef {Object} NavigationProps
 * @property {Array<{href: string, label: string}>} links - Navigation links
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Animated navigation bar with responsive design and smooth transitions
 *
 * @param {NavigationProps} props
 */
const Navigation = ({ links, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { hover, onHover, onLeave } = useHoverAnimation();
  const { scrollY } = useScrollAnimation();

  const navVariants = {
    hidden: { y: -100 },
    visible: {
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 20,
      },
    },
  };

  const linkVariants = {
    hover: {
      scale: 1.05,
      color: "var(--color-primary-500)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10,
      },
    },
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      scale: 0.95,
      transition: {
        duration: 0.2,
      },
    },
    open: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.2,
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="visible"
      className={`fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm shadow-sm ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <motion.a
            href="/"
            className="text-xl font-bold text-primary-600 hover-lift"
            onHoverStart={onHover}
            onHoverEnd={onLeave}
            animate={hover ? "hover" : ""}
          >
            Community Connect
          </motion.a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            {links.map((link) => (
              <motion.a
                key={link.href}
                href={link.href}
                variants={linkVariants}
                whileHover="hover"
                className="text-gray-600 hover:text-primary-500 transition-colors"
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <motion.button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setIsOpen(!isOpen)}
            whileTap={{ scale: 0.95 }}
            aria-expanded={isOpen}
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            <span className="sr-only">{isOpen ? "Close menu" : "Open menu"}</span>
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16m-7 6h7"
                />
              )}
            </svg>
          </motion.button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              className="md:hidden py-4"
            >
              <div className="flex flex-col space-y-4">
                {links.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    variants={linkVariants}
                    whileHover="hover"
                    className="text-gray-600 hover:text-primary-500 transition-colors px-4 py-2 rounded-lg hover:bg-gray-50"
                  >
                    {link.label}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
};

export default Navigation;
