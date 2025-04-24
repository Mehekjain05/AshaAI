// src/components/AccessDeniedCard.tsx
import React from 'react';
import { FaExclamationTriangle } from 'react-icons/fa'; // Using a warning icon

interface AccessDeniedCardProps {
  /** The resource or action that was denied */
  resource: string;
  /** The reason provided for the denial */
  reason: string;
  /** The timestamp when the denial occurred */
  timestamp: string;
}

const AccessDeniedCard: React.FC<AccessDeniedCardProps> = ({ resource, reason, timestamp }) => {
  return (
    <div className="p-4 rounded-lg bg-red-50 border border-red-200 shadow-md max-w-md w-full">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="mt-1 text-red-500 text-xl">
          <FaExclamationTriangle />
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Title/Resource */}
          <h4 className="font-semibold text-red-800 text-sm mb-1">
            {resource || 'Access Denied'} {/* Provide a default title */}
          </h4>

          {/* Reason */}
          <p className="text-red-700 text-xs mb-2">
            {reason || 'No specific reason provided.'} {/* Provide a default reason */}
          </p>

          {/* Timestamp */}
          <p className="text-red-500 text-xs italic">
            {timestamp}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccessDeniedCard;