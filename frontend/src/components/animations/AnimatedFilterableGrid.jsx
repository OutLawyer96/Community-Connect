import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * AnimatedFilterableGrid - Smooth grid animations for filtering
 * 
 * Implementation Strategy:
 * - AnimatePresence enables exit animations for removed items
 * - layout prop on motion.div automatically animates position changes
 * - Each item gets unique key for proper animation tracking
 * - Stagger children for cascading entrance effect
 * - Exit animations fade out while new items fade in
 * 
 * Integration: Use in Providers.js for the provider grid
 * This component shows the pattern - adapt to your ProviderCard structure
 * 
 * Example in Providers.js:
 * const [filter, setFilter] = useState('all');
 * const filteredProviders = providers.filter(p => 
 *   filter === 'all' || p.category === filter
 * );
 * 
 * <AnimatedProviderGrid providers={filteredProviders} />
 */

// Container animation for stagger effect
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

// Individual item animation
const itemVariants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    y: 20,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2,
    },
  },
};

/**
 * Main AnimatedFilterableGrid component
 */
const AnimatedFilterableGrid = ({ items, renderItem, className = "" }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            {renderItem(item)}
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

/**
 * Example implementation for Providers.js
 */
export const ProvidersGridExample = () => {
  const [activeFilter, setActiveFilter] = useState("all");

  // Mock data - replace with your actual provider data
  const allProviders = [
    { id: 1, name: "Dr. Smith", category: "doctor", specialty: "Cardiology" },
    { id: 2, name: "Jane Lawyer", category: "lawyer", specialty: "Family Law" },
    { id: 3, name: "Bob Builder", category: "contractor", specialty: "Construction" },
    // ... more providers
  ];

  // Filter providers based on active filter
  const filteredProviders = useMemo(() => {
    if (activeFilter === "all") return allProviders;
    return allProviders.filter((p) => p.category === activeFilter);
  }, [activeFilter, allProviders]);

  const filters = [
    { id: "all", label: "All Providers" },
    { id: "doctor", label: "Doctors" },
    { id: "lawyer", label: "Lawyers" },
    { id: "contractor", label: "Contractors" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-3 mb-8">
        {filters.map((filter) => (
          <motion.button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`
              px-6 py-2 rounded-full font-medium transition-colors
              ${
                activeFilter === filter.id
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }
            `}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>

      {/* Results Count */}
      <motion.p
        key={filteredProviders.length}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-gray-600 mb-4"
      >
        Showing {filteredProviders.length} provider
        {filteredProviders.length !== 1 ? "s" : ""}
      </motion.p>

      {/* Animated Grid */}
      <AnimatedFilterableGrid
        items={filteredProviders}
        renderItem={(provider) => (
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <h3 className="text-xl font-bold text-gray-900">{provider.name}</h3>
            <p className="text-gray-600 mt-2">{provider.specialty}</p>
            <span className="inline-block mt-3 px-3 py-1 bg-indigo-100 text-indigo-800 text-sm rounded-full">
              {provider.category}
            </span>
          </div>
        )}
      />
    </div>
  );
};

/**
 * Simplified version for direct use in Providers.js
 */
export const AnimatedProviderGrid = ({ providers, ProviderCardComponent }) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      <AnimatePresence mode="popLayout">
        {providers.map((provider) => (
          <motion.div
            key={provider.id}
            layout
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <ProviderCardComponent {...provider} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default AnimatedFilterableGrid;
