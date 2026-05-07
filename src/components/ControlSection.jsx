import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const ControlSection = ({ 
  title, 
  icon: Icon, 
  children, 
  className = '', 
  headerClassName = '',
  titleColor = null,
  iconColor = null,
  isLightMode = false
}) => {
  const defaultTitleColor = titleColor || (isLightMode ? "text-gray-700" : "text-gray-300");
  const defaultIconColor = iconColor || (isLightMode ? "text-gray-500" : "text-gray-400");
  const defaultBgColor = isLightMode ? "bg-gray-50 border-gray-200" : "bg-gray-800/50 border-gray-700/50";

  return (
    <div className={cn("p-4 rounded-lg border", defaultBgColor, className)}>
      <h2 className={cn("text-sm font-semibold uppercase tracking-wider mb-4 flex items-center", defaultTitleColor, headerClassName)}>
        {Icon && <Icon className={cn("w-4 h-4 mr-2", defaultIconColor)} />}
        {title}
      </h2>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
};

export default ControlSection;
