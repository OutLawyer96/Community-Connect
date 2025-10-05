import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";
import { useInView } from "react-intersection-observer";
import { motion } from "framer-motion";
import { Star, MapPin, MessageCircle } from "lucide-react";
import SpotlightCard from "./SpotlightCard";
import TiltCard from "./animations/TiltCard";
import FavoriteButton from "./animations/FavoriteButton";

const ProviderCard = ({ provider, index }) => {
  const [isFavorite, setIsFavorite] = useState(false);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const springProps = useSpring({
    from: { opacity: 0, transform: "translateY(30px)" },
    to: {
      opacity: inView ? 1 : 0,
      transform: inView ? "translateY(0)" : "translateY(30px)",
    },
    delay: index * 100, // Staggered animation
    config: { tension: 280, friction: 60 },
  });

  return (
    <SpotlightCard spotlightColor="rgba(14, 165, 233, 0.25)" className="">
      <TiltCard>
        <animated.div
          ref={ref}
          style={springProps}
          className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full"
        >
          <Link to={`/providers/${provider.id}`}>
            {provider.image && (
              <div className="relative h-48 overflow-hidden">
                <motion.img
                  layoutId={`provider-image-${provider.id}`}
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 z-10">
                  <FavoriteButton
                    isFavorite={isFavorite}
                    onToggle={(newState) => {
                      setIsFavorite(newState);
                      console.log("Provider favorite toggled:", provider.id, newState);
                    }}
                  />
                </div>
              </div>
            )}
            <div className="p-4">
              <motion.h3 
                layoutId={`provider-name-${provider.id}`}
                className="text-xl font-semibold mb-2"
              >
                {provider.name}
              </motion.h3>
              <div className="flex items-center mb-2">
                <MapPin className="w-4 h-4 text-gray-500 mr-1" />
                <span className="text-gray-600 text-sm">{provider.location}</span>
              </div>
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-400 mr-1" />
                <span className="text-gray-600">
                  {provider.rating} ({provider.reviewCount} reviews)
                </span>
              </div>
              <p className="text-gray-600 mb-4 line-clamp-2">
                {provider.description}
              </p>
              <div className="flex justify-between items-center">
                <button
                  className="flex items-center text-blue-600 hover:text-blue-800"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Contact
                </button>
                <span className="text-gray-500 text-sm">
                  {provider.distance} away
                </span>
              </div>
            </div>
          </Link>
        </animated.div>
      </TiltCard>
    </SpotlightCard>
  );
};

export default ProviderCard;
