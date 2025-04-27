// src/components/EventCard.tsx
import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaTag, FaExternalLinkAlt, FaPencilAlt } from 'react-icons/fa';

// Define the structure of the event data based on your example
export interface EventData {
  title: string;
  image?: string; // Optional image
  categories: string[]; // Assuming it's parsed into an array
  mode: string;
  date: string;
  time: string;
  venue: string;
  price: string;
  event_url: string;
  register_url: string;
}

interface EventCardProps {
  event: EventData;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const renderLinkButton = (url: string, text: string, icon: JSX.Element) => {
    if (!url || url.toLowerCase() === 'n/a') {
      return null; // Don't render button if URL is invalid or N/A
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center px-3 py-1 bg-blue-500 text-white text-xs font-medium rounded-md hover:bg-blue-600 transition-colors duration-150"
      >
        {icon}
        <span className="ml-1.5">{text}</span>
      </a>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col sm:flex-row p-4 gap-4 hover:shadow-md transition-shadow duration-150">
      {/* Image Section (Optional) */}
      {event.image && (
        <div className="flex-shrink-0 sm:w-32 h-32 sm:h-auto">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-cover rounded-md"
            onError={(e) => (e.currentTarget.style.display = 'none')} // Hide if image fails to load
          />
        </div>
      )}

      {/* Details Section */}
      <div className="flex-grow">
        <h3 className="text-base font-semibold text-gray-800 mb-2">{event.title}</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 mb-3">
          <div className="flex items-center gap-1.5">
            <FaCalendarAlt className="text-gray-400" />
            <span>{event.date || 'Date not specified'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaClock className="text-gray-400" />
            <span>{event.time || 'Time not specified'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <FaTag className="text-gray-400" />
            <span>{event.mode}</span>
            {event.price && event.price.toLowerCase() !== 'n/a' && (
              <span className="ml-2 font-medium text-green-700">{event.price}</span>
            )}
             {event.price && event.price.toLowerCase() === 'n/a' && (
              <span className="ml-2 text-gray-500">Free</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <FaMapMarkerAlt className="text-gray-400" />
            <span>{event.venue || 'Venue not specified'}</span>
          </div>
        </div>

        {/* Categories */}
        {event.categories && event.categories.length > 0 && (
          <div className="mb-3">
            {event.categories.map((category, index) => (
              <span
                key={index}
                className="inline-block bg-indigo-100 text-indigo-700 text-xs font-medium mr-2 mb-1 px-2.5 py-0.5 rounded-full"
              >
                {category}
              </span>
            ))}
          </div>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2">
          {renderLinkButton(event.event_url, 'View Event', <FaExternalLinkAlt />)}
          {renderLinkButton(event.register_url, 'Register', <FaPencilAlt />)}
        </div>
      </div>
    </div>
  );
};

export default EventCard;