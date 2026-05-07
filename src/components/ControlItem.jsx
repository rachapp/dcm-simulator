import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ControlItem = ({ 
  label, 
  value, 
  min, 
  max, 
  step = 0.1, 
  onChange, 
  disabled = false,
  unit = '',
  className = '',
  valueClassName = 'text-blue-400',
  labelClassName = null,
  isLightMode = false
}) => {
  const [inputValue, setInputValue] = React.useState(value);

  React.useEffect(() => {
    setInputValue(value);
  }, [value]);

  const handleInputChange = (e) => {
    const raw = e.target.value;
    
    // Allow typing decimals and negative signs
    if (raw === '' || raw === '-' || raw === '.' || raw === '-.') {
      setInputValue(raw);
      return;
    }

    // Only update if it's a valid partial number structure
    if (/^-?\d*\.?\d*$/.test(raw)) {
      setInputValue(raw);
      const val = parseFloat(raw);
      if (!isNaN(val) && val !== value) {
        onChange(val);
      }
    }
  };

  const handleBlur = () => {
    setInputValue(value);
  };

  const defaultLabelColor = labelClassName || (isLightMode ? "text-gray-500" : "text-gray-400");
  const defaultInputBg = isLightMode ? "bg-white border-gray-300" : "bg-gray-950 border-gray-700";

  return (
    <div className={cn("space-y-1.5", disabled && "opacity-50 cursor-not-allowed", className)}>
      <div className="flex justify-between items-center">
        <label className={cn("text-xs font-medium uppercase tracking-tight", defaultLabelColor)}>
          {label} {unit && <span className="lowercase text-[10px]">({unit})</span>}
        </label>
        <input 
          type="number" 
          step="any"
          disabled={disabled}
          className={cn(
            "border rounded px-2 py-0.5 text-xs text-right w-20 font-mono outline-none focus:border-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-auto [&::-webkit-inner-spin-button]:appearance-auto",
            defaultInputBg,
            valueClassName,
            disabled && "cursor-not-allowed"
          )}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
        />
      </div>
      <input 
        type="range" 
        step={step} 
        min={min} 
        max={max} 
        disabled={disabled}
        className={cn(
          "w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all",
          disabled && "cursor-not-allowed"
        )}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
};

export default ControlItem;
