import React from "react";
import "./ShimmeringSkeleton.css";

/**
 * ShimmeringSkeleton - Animated loading placeholder
 * 
 * Implementation Strategy:
 * - Uses CSS keyframes for smooth shimmer animation
 * - Linear gradient moves from left to right creating shine effect
 * - Accepts width, height, and variant props for flexibility
 * - Uses Tailwind for structure and custom CSS for animation
 * 
 * Integration: Use as placeholder in Providers.js while data loads
 * Example: 
 * {loading ? (
 *   <ShimmeringSkeleton count={6} variant="card" />
 * ) : (
 *   providers.map(provider => <ProviderCard key={provider.id} {...provider} />)
 * )}
 */
const ShimmeringSkeleton = ({
  width = "100%",
  height = "20px",
  className = "",
  variant = "default",
  count = 1,
}) => {
  // Predefined skeleton variants
  const variants = {
    default: "h-4 rounded",
    text: "h-4 rounded w-3/4",
    title: "h-8 rounded w-1/2",
    avatar: "h-12 w-12 rounded-full",
    card: "h-64 rounded-lg",
    thumbnail: "h-48 rounded-lg",
  };

  const variantClass = variants[variant] || variants.default;

  const skeletonElement = (
    <div
      className={`shimmer-skeleton ${variantClass} ${className}`}
      style={{
        width: variant === "default" ? width : undefined,
        height: variant === "default" ? height : undefined,
      }}
    >
      <div className="shimmer-wave" />
    </div>
  );

  // Render multiple skeletons if count > 1
  if (count > 1) {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <React.Fragment key={index}>{skeletonElement}</React.Fragment>
        ))}
      </div>
    );
  }

  return skeletonElement;
};

// Predefined skeleton layouts for common use cases
export const SkeletonCard = () => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <ShimmeringSkeleton variant="thumbnail" />
    <div className="p-4 space-y-3">
      <ShimmeringSkeleton variant="title" />
      <ShimmeringSkeleton variant="text" />
      <ShimmeringSkeleton variant="text" className="w-1/2" />
    </div>
  </div>
);

export const SkeletonProfile = () => (
  <div className="flex items-center space-x-4">
    <ShimmeringSkeleton variant="avatar" />
    <div className="flex-1 space-y-2">
      <ShimmeringSkeleton variant="title" />
      <ShimmeringSkeleton variant="text" />
    </div>
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="flex items-center space-x-4">
        <ShimmeringSkeleton variant="avatar" className="flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <ShimmeringSkeleton variant="text" />
          <ShimmeringSkeleton variant="text" className="w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

export default ShimmeringSkeleton;
