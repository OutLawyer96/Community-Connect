import React from "react";
import { Link } from "react-router-dom";
import { useSpring, animated } from "@react-spring/web";
import { useInView } from "react-intersection-observer";
import { Star, MapPin, MessageCircle } from "lucide-react";

const ProviderCard = ({ provider, index }) => {
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

  const hoverProps = useSpring({
    scale: 1,
    config: { tension: 300, friction: 10 },
  });

  const onHover = () => {
    hoverProps.scale.start(1.03);
  };

  const onLeave = () => {
    hoverProps.scale.start(1);
  };

  return (
    <animated.div
      ref={ref}
      style={{ ...springProps, ...hoverProps }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
    >
      <Link to={`/providers/${provider.id}`}>
        {provider.image && (
          <div className="relative h-48 overflow-hidden">
            <animated.img
              src={provider.image}
              alt={provider.name}
              className="w-full h-full object-cover"
              style={{
                transform: hoverProps.scale.to((s) => `scale(${s})`),
              }}
            />
          </div>
        )}
        <div className="p-4">
          <h3 className="text-xl font-semibold mb-2">{provider.name}</h3>
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
            <animated.button
              className="flex items-center text-blue-600 hover:text-blue-800"
              style={{
                transform: hoverProps.scale.to((s) => `scale(${s})`),
              }}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Contact
            </animated.button>
            <span className="text-gray-500 text-sm">
              {provider.distance} away
            </span>
          </div>
        </div>
      </Link>
    </animated.div>
  );
};

export default ProviderCard;
