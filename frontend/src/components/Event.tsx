
// src/components/EventCard.tsx
import React from 'react';
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaDollarSign, FaLink, FaEdit, FaTags, FaDesktop, FaUsers } from 'react-icons/fa';

// Define the structure of the event prop more explicitly
interface EventData {
  title: string;
  image?: string;
  categories?: string[] | string; // Can be array or string representation of array
  mode?: string;
  date?: string;
  time?: string;
  venue?: string;
  price?: string;
  event_url?: string;
  register_url?: string;
}

interface EventCardProps {
  event: EventData;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Helper to parse categories if they are a string like "['cat1', 'cat2']"
  const parseCategories = (cats: string[] | string | undefined): string[] => {
    if (Array.isArray(cats)) {
      return cats;
    }
    if (typeof cats === 'string' && cats.startsWith('[') && cats.endsWith(']')) {
      try {
        // Attempt to parse it like JSON after replacing single quotes if necessary
         // More robustly handle single quotes inside the brackets
         constsanitizedString = cats.slice(1, -1) // Remove brackets
                                  .split(/',\s*'/) // Split by ', ' including quotes
                                  .map(s => s.replace(/^'|'$/g, '')); // Remove leading/trailing single quotes
         return sanitizedString.filter(Boolean); // Filter out empty strings
      } catch (e) {
        console.error("Failed to parse categories string:", cats, e);
        return [cats]; // Return the raw string as a single category on failure
      }
    }
    if (typeof cats === 'string') {
        return [cats]; // Treat as a single category if just a string
    }
    return []; // Return empty array if undefined or other type
  };

  const categories = parseCategories(event.categories);

  const renderLinkButton = (url: string | undefined, text: string, Icon: React.ElementType) => {
    if (!url || url === 'N/A') return null;
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 border border-blue-200 rounded-md hover:bg-blue-200 hover:text-blue-800 transition-colors duration-150 mr-2 mb-2"
      >
        <Icon className="w-3 h-3" />
        {text}
      </a>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden mb-4">
      {event.image && event.image !== 'N/A' && (
        <img src={event.image} alt={event.title} className="w-full h-32 object-cover" />
      )}
      <div className="p-4">
        <h3 className="text-base font-semibold text-gray-800 mb-2">{event.title}</h3>

        {categories.length > 0 && (
          <div className="mb-3 flex flex-wrap items-center gap-1 text-xs text-gray-600">
            <FaTags className="w-3 h-3 text-gray-400" />
            {categories.map((cat, index) => (
              <span key={index} className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-xs">
                {cat}
              </span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-600 mb-3">
          {event.mode && event.mode !== 'N/A' && (
            <div className="flex items-center gap-1.5">
               {event.mode.toLowerCase() === 'online' ? <FaDesktop className="w-3.5 h-3.5 text-gray-400" /> : <FaUsers className="w-3.5 h-3.5 text-gray-400" /> }
              <span>{event.mode}</span>
            </div>
          )}
           {event.date && event.date !== 'N/A' && (
            <div className="flex items-center gap-1.5">
              <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
              <span>{event.date}</span>
            </div>
          )}
          {event.time && event.time !== 'N/A' && (
            <div className="flex items-center gap-1.5">
              <FaClock className="w-3.5 h-3.5 text-gray-400" />
              <span>{event.time}</span>
            </div>
          )}
          {event.venue && event.venue !== 'N/A' && (
            <div className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="w-3.5 h-3.5 text-gray-400" />
              <span>{event.venue}</span>
            </div>
          )}
          {event.price && ( // Show even if N/A, maybe style differently?
             <div className="flex items-center gap-1.5">
              <FaDollarSign className="w-3.5 h-3.5 text-gray-400" />
              <span>{event.price === 'N/A' || event.price === '₹ 1' ? (event.price === '₹ 1' ? '₹ 1 (Nominal Fee)' : 'Free / Check Link') : event.price}</span>
            </div>
          )}
        </div>

        <div>
          {renderLinkButton(event.event_url, "Details", FaLink)}
          {renderLinkButton(event.register_url, "Register", FaEdit)}
        </div>
      </div>
    </div>
  );
};

export default EventCard;