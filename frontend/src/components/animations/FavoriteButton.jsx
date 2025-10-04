import React, { useRef, useState } from "react";
import Lottie from "lottie-react";

/**
 * FavoriteButton - Animated heart button using Lottie
 * 
 * Implementation Strategy:
 * - Uses lottie-react to render a heart animation
 * - Plays animation on click using lottieRef.current.play()
 * - Manages favorite state (isFavorite) to toggle between filled/unfilled
 * - Animation plays from frame 0-60 for the fill/burst effect
 * 
 * Integration: Use inside ProviderCard.js
 * Example: <FavoriteButton providerId={provider.id} onToggle={handleFavorite} />
 */
const FavoriteButton = ({ providerId, onToggle, initialFavorite = false }) => {
  const lottieRef = useRef();
  const [isFavorite, setIsFavorite] = useState(initialFavorite);

  // Heart animation JSON - You can replace with your own Lottie file
  const heartAnimation = {
    v: "5.7.4",
    fr: 60,
    ip: 0,
    op: 60,
    w: 100,
    h: 100,
    nm: "Heart",
    ddd: 0,
    assets: [],
    layers: [
      {
        ddd: 0,
        ind: 1,
        ty: 4,
        nm: "Heart",
        sr: 1,
        ks: {
          o: { a: 0, k: 100 },
          r: { a: 0, k: 0 },
          p: { a: 0, k: [50, 50, 0] },
          a: { a: 0, k: [0, 0, 0] },
          s: {
            a: 1,
            k: [
              { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 0, s: [100, 100, 100] },
              { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 15, s: [120, 120, 100] },
              { i: { x: [0.667], y: [1] }, o: { x: [0.333], y: [0] }, t: 30, s: [100, 100, 100] },
              { t: 45, s: [110, 110, 100] }
            ]
          }
        },
        ao: 0,
        shapes: [
          {
            ty: "gr",
            it: [
              {
                ty: "sh",
                d: 1,
                ks: {
                  a: 0,
                  k: {
                    i: [[0, 0], [0, 0], [-10, -10], [0, -15], [15, 0], [10, 10], [10, -10], [15, 0], [0, 15], [-10, 10]],
                    o: [[0, 0], [10, -10], [15, 0], [0, 15], [-10, 10], [-10, 10], [10, 10], [15, 0], [0, -15], [-10, -10]],
                    v: [[0, 15], [0, 15], [15, -5], [35, -5], [35, 10], [15, 30], [0, 45], [-15, 30], [-35, 10], [-35, -5]],
                    c: true
                  }
                }
              },
              {
                ty: "fl",
                c: {
                  a: 1,
                  k: [
                    { t: 0, s: [0.5, 0.5, 0.5, 1] },
                    { t: 15, s: [1, 0.2, 0.3, 1] },
                    { t: 30, s: [1, 0.1, 0.2, 1] }
                  ]
                },
                o: { a: 0, k: 100 },
                r: 1
              },
              {
                ty: "tr",
                p: { a: 0, k: [0, 0] },
                a: { a: 0, k: [0, 0] },
                s: { a: 0, k: [100, 100] },
                r: { a: 0, k: 0 },
                o: { a: 0, k: 100 }
              }
            ]
          }
        ]
      }
    ]
  };

  const handleClick = () => {
    // Play the animation
    if (lottieRef.current) {
      lottieRef.current.stop();
      lottieRef.current.play();
    }

    const newFavoriteState = !isFavorite;
    setIsFavorite(newFavoriteState);
    
    // Callback to parent component
    if (onToggle) {
      onToggle(providerId, newFavoriteState);
    }
  };

  return (
    <button
      onClick={handleClick}
      className="relative w-12 h-12 flex items-center justify-center transition-transform hover:scale-110"
      aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <Lottie
        lottieRef={lottieRef}
        animationData={heartAnimation}
        loop={false}
        autoplay={false}
        style={{ width: 40, height: 40 }}
      />
    </button>
  );
};

export default FavoriteButton;
