import React from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin } from "lucide-react";
import { useScrollAnimation } from "../hooks/useScrollAnimation";

/**
 * @typedef {Object} FooterProps
 * @property {string} [className] - Additional CSS classes
 */

/**
 * Animated footer component with scroll reveal effects
 *
 * @param {FooterProps} props
 */
const Footer = ({ className = "" }) => {
  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
    },
  };

  const socialLinks = [
    { icon: "facebook", href: "#" },
    { icon: "twitter", href: "#" },
    { icon: "instagram", href: "#" },
    { icon: "linkedin", href: "#" },
  ];

  return (
    <motion.footer
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={`bg-gray-900 text-white py-12 ${className}`}
    >
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h3 className="text-xl font-bold">Community Connect</h3>
            <p className="text-gray-400 max-w-xs">
              Bringing communities together through technology and innovation.
            </p>
          </motion.div>

          {/* Quick Links */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              {["About", "Services", "Contact", "Blog"].map((link) => (
                <motion.li
                  key={link}
                  whileHover={{ x: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <a
                    href={`#${link.toLowerCase()}`}
                    className="text-gray-400 hover:text-primary-400 transition-colors"
                  >
                    {link}
                  </a>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact Information */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <div className="space-y-3">
              <motion.a
                href="mailto:info@communityconnect.com"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-start space-x-3 text-gray-400 hover:text-primary-400 transition-colors group"
              >
                <Mail className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:text-primary-400" />
                <span className="text-sm">info@communityconnect.com</span>
              </motion.a>

              <motion.a
                href="tel:+1-555-123-4567"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-start space-x-3 text-gray-400 hover:text-primary-400 transition-colors group"
              >
                <Phone className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:text-primary-400" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </motion.a>

              <motion.div
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="flex items-start space-x-3 text-gray-400 group cursor-default"
              >
                <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0 group-hover:text-primary-400" />
                <span className="text-sm">
                  123 Community Street
                  <br />
                  Springfield, IL 62701
                  <br />
                  United States
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* Newsletter */}
          <motion.div variants={itemVariants} className="space-y-4">
            <h4 className="text-lg font-semibold">Stay Updated</h4>
            <form
              className="space-y-2"
              onSubmit={(e) => {
                e.preventDefault();
                // TODO: Implement newsletter subscription logic
              }}
            >
              <motion.input
                whileFocus={{ scale: 1.02 }}
                type="email"
                placeholder="Enter your email"
                required
                className="w-full px-4 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-primary-500 transition-colors"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="w-full px-4 py-2 rounded bg-primary-500 hover:bg-primary-600 transition-colors"
              >
                Subscribe
              </motion.button>
            </form>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          variants={itemVariants}
          className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0"
        >
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} Community Connect. All rights reserved.
          </p>

          {/* Social Links */}
          <div className="flex space-x-4">
            {socialLinks.map(({ icon, href }) => (
              <motion.a
                key={icon}
                href={href}
                whileHover={{ y: -2, scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="text-gray-400 hover:text-primary-400 transition-colors"
              >
                <span className="sr-only">{icon}</span>
                <i className={`fab fa-${icon} text-xl`}></i>
              </motion.a>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.footer>
  );
};

export default Footer;
