import React, { useState, useCallback, useEffect } from 'react';
import { DollarSign } from 'lucide-react';

/**
 * PriceRangeSlider Component
 * Dual-handle range slider for price filtering
 */
const PriceRangeSlider = ({ 
  onRangeChange, 
  min = 0, 
  max = 1000, 
  step = 10,
  initialMin = 0,
  initialMax = 1000,
  className = "",
  showInputs = true,
  formatValue = (value) => `$${value}`
}) => {
  const [minValue, setMinValue] = useState(initialMin);
  const [maxValue, setMaxValue] = useState(initialMax);
  const [isDragging, setIsDragging] = useState(false);

  // Ensure values are within bounds
  const clampValue = useCallback((value, minBound, maxBound) => {
    return Math.max(minBound, Math.min(maxBound, value));
  }, []);

  // Handle min value change
  const handleMinChange = useCallback((value) => {
    const newMin = clampValue(parseInt(value), min, maxValue - step);
    setMinValue(newMin);
    
    if (!isDragging) {
      onRangeChange?.({ min: newMin, max: maxValue });
    }
  }, [minValue, maxValue, min, step, isDragging, onRangeChange, clampValue]);

  // Handle max value change
  const handleMaxChange = useCallback((value) => {
    const newMax = clampValue(parseInt(value), minValue + step, max);
    setMaxValue(newMax);
    
    if (!isDragging) {
      onRangeChange?.({ min: minValue, max: newMax });
    }
  }, [minValue, maxValue, max, step, isDragging, onRangeChange, clampValue]);

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setIsDragging(false);
    onRangeChange?.({ min: minValue, max: maxValue });
  };

  // Update initial values when props change
  useEffect(() => {
    setMinValue(clampValue(initialMin, min, max));
    setMaxValue(clampValue(initialMax, min, max));
  }, [initialMin, initialMax, min, max, clampValue]);

  // Calculate percentages for styling
  const minPercent = ((minValue - min) / (max - min)) * 100;
  const maxPercent = ((maxValue - min) / (max - min)) * 100;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        <DollarSign className="w-5 h-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-700">Price Range</span>
      </div>

      {/* Slider container */}
      <div className="relative">
        <div className="relative h-2 bg-gray-200 rounded-lg">
          {/* Active range highlight */}
          <div
            className="absolute h-2 bg-blue-500 rounded-lg"
            style={{
              left: `${minPercent}%`,
              right: `${100 - maxPercent}%`
            }}
          />
          
          {/* Min value slider */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={minValue}
            onChange={(e) => handleMinChange(e.target.value)}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
            style={{ zIndex: 1 }}
            aria-label="Minimum price"
          />
          
          {/* Max value slider */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={maxValue}
            onChange={(e) => handleMaxChange(e.target.value)}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            className="absolute w-full h-2 bg-transparent appearance-none cursor-pointer slider-thumb"
            style={{ zIndex: 2 }}
            aria-label="Maximum price"
          />
        </div>

        {/* Value labels on slider */}
        <div className="relative mt-2">
          <div
            className="absolute text-xs text-blue-600 font-medium transform -translate-x-1/2"
            style={{ left: `${minPercent}%` }}
          >
            {formatValue(minValue)}
          </div>
          <div
            className="absolute text-xs text-blue-600 font-medium transform -translate-x-1/2"
            style={{ left: `${maxPercent}%` }}
          >
            {formatValue(maxValue)}
          </div>
        </div>
      </div>

      {/* Input fields */}
      {showInputs && (
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <label htmlFor="min-price" className="block text-xs font-medium text-gray-700 mb-1">
              Min Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                id="min-price"
                type="number"
                min={min}
                max={maxValue - step}
                step={step}
                value={minValue}
                onChange={(e) => handleMinChange(e.target.value)}
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label htmlFor="max-price" className="block text-xs font-medium text-gray-700 mb-1">
              Max Price
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500 text-sm">$</span>
              </div>
              <input
                id="max-price"
                type="number"
                min={minValue + step}
                max={max}
                step={step}
                value={maxValue}
                onChange={(e) => handleMaxChange(e.target.value)}
                className="block w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Range display */}
      <div className="text-center text-sm text-gray-600">
        {formatValue(minValue)} - {formatValue(maxValue)}
      </div>

      <style jsx>{`
        .slider-thumb::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider-thumb::-moz-range-thumb {
          height: 20px;
          width: 20px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
          border: 2px solid white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        
        .slider-thumb::-webkit-slider-thumb:hover {
          background: #2563eb;
        }
        
        .slider-thumb::-moz-range-thumb:hover {
          background: #2563eb;
        }
        
        .slider-thumb:focus {
          outline: none;
        }
        
        .slider-thumb:focus::-webkit-slider-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
        
        .slider-thumb:focus::-moz-range-thumb {
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }
      `}</style>
    </div>
  );
};

export default PriceRangeSlider;