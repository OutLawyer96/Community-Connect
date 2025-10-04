import { motion } from "framer-motion";
import PropTypes from "prop-types";
import { useEffect, useState } from "react";

/**
 * Animated background component with gradient shifts and floating particles
 * @param {Object} props - Component props
 * @param {string} [props.className] - Additional CSS classes
 * @param {string[]} [props.colors] - Array of gradient colors
 * @param {number} [props.particleCount] - Number of floating particles
 * @param {number} [props.intensity] - Animation intensity (0-1)
 */
const AnimatedBackground = ({
  className = "",
  colors = ["#4F46E5", "#7C3AED", "#2563EB"],
  particleCount = 20,
  intensity = 0.5,
}) => {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 10 + 5,
      duration: Math.random() * 10 + 15,
      delay: Math.random() * 5,
    }));
    setParticles(newParticles);
  }, [particleCount]);

  const gradientStyle = {
    background: `linear-gradient(45deg, ${colors.join(", ")})`,
    backgroundSize: "400% 400%",
  };

  return (
    <motion.div
      className={`fixed inset-0 overflow-hidden ${className}`}
      style={gradientStyle}
      animate={{
        backgroundPosition: ["0% 0%", "100% 100%"],
      }}
      transition={{
        duration: 20 / intensity,
        ease: "linear",
        repeat: Infinity,
        repeatType: "reverse",
      }}
    >
      {/* Floating particles */}
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-white/10 backdrop-blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: particle.size,
            height: particle.size,
          }}
          animate={{
            y: [0, -30 * intensity, 0],
            x: [0, 15 * intensity, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}

      {/* Glass overlay */}
      <div className="absolute inset-0 backdrop-blur-[100px]" />
    </motion.div>
  );
};

AnimatedBackground.propTypes = {
  className: PropTypes.string,
  colors: PropTypes.arrayOf(PropTypes.string),
  particleCount: PropTypes.number,
  intensity: PropTypes.number,
};

export default AnimatedBackground;
