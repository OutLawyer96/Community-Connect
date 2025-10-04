import React, { useRef, useCallback } from "react";
import "./SpotlightCard.css";

const SpotlightCard = ({
  children,
  className = "",
  spotlightColor = "rgba(255, 255, 255, 0.05)",
}) => {
  const divRef = useRef(null);
  const rectRef = useRef(null);
  const rafRef = useRef(null);

  // Cache bounding rect on pointer enter
  const handlePointerEnter = useCallback(() => {
    if (divRef.current) {
      rectRef.current = divRef.current.getBoundingClientRect();
    }
  }, []);

  // Update spotlight position with requestAnimationFrame
  const updateSpotlight = useCallback(
    (clientX, clientY) => {
      if (!divRef.current || !rectRef.current) return;

      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }

      rafRef.current = requestAnimationFrame(() => {
        if (!divRef.current || !rectRef.current) return;

        const x = clientX - rectRef.current.left;
        const y = clientY - rectRef.current.top;

        divRef.current.style.setProperty("--mouse-x", `${x}px`);
        divRef.current.style.setProperty("--mouse-y", `${y}px`);
        divRef.current.style.setProperty("--spotlight-color", spotlightColor);
      });
    },
    [spotlightColor]
  );

  // Handle pointer/mouse movement
  const handlePointerMove = useCallback(
    (e) => {
      updateSpotlight(e.clientX, e.clientY);
    },
    [updateSpotlight]
  );

  // Clear cached rect on pointer leave
  const handlePointerLeave = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  // Update cached rect on resize
  React.useEffect(() => {
    const handleResize = () => {
      if (divRef.current) {
        rectRef.current = divRef.current.getBoundingClientRect();
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={divRef}
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`card-spotlight ${className}`}
    >
      {children}
    </div>
  );
};

export default SpotlightCard;
