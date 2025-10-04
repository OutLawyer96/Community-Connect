import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

/**
 * Shared Layout Animation - "Magic Move" Transition
 * 
 * Implementation Strategy:
 * - Use layoutId prop on motion elements to create shared element transitions
 * - Same layoutId on both pages creates seamless morphing animation
 * - AnimatePresence in App.js wraps Routes to enable exit animations
 * 
 * Integration Instructions:
 * 
 * 1. In App.js, wrap your Routes with AnimatePresence:
 * 
 * import { AnimatePresence } from "framer-motion";
 * 
 * <AnimatePresence mode="wait">
 *   <Routes location={location} key={location.pathname}>
 *     <Route path="/providers" element={<Providers />} />
 *     <Route path="/providers/:id" element={<ProviderDetail />} />
 *   </Routes>
 * </AnimatePresence>
 * 
 * 2. In ProviderCard.js (on Providers.js page):
 */

// Example for ProviderCard.js
export const ProviderCardWithSharedLayout = ({ provider }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer"
      onClick={() => navigate(`/providers/${provider.id}`)}
    >
      {/* Shared Image - layoutId creates the magic move effect */}
      <motion.img
        layoutId={`provider-image-${provider.id}`}
        src={provider.image}
        alt={provider.name}
        className="w-full h-48 object-cover"
      />
      
      <div className="p-4">
        <motion.h3
          layoutId={`provider-name-${provider.id}`}
          className="text-xl font-bold text-gray-900"
        >
          {provider.name}
        </motion.h3>
        
        <p className="text-gray-600 mt-2">{provider.specialty}</p>
      </div>
    </motion.div>
  );
};

/**
 * 3. In ProviderDetail.js page:
 */
export const ProviderDetailWithSharedLayout = ({ provider }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Shared Image - same layoutId creates seamless transition */}
      <motion.img
        layoutId={`provider-image-${provider.id}`}
        src={provider.image}
        alt={provider.name}
        className="w-full h-96 object-cover rounded-lg"
      />
      
      <div className="mt-6">
        <motion.h1
          layoutId={`provider-name-${provider.id}`}
          className="text-4xl font-bold text-gray-900"
        >
          {provider.name}
        </motion.h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <p className="text-xl text-gray-600 mt-4">{provider.specialty}</p>
          <p className="text-gray-700 mt-6">{provider.description}</p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default { ProviderCardWithSharedLayout, ProviderDetailWithSharedLayout };
