// components/EventsSection.tsx
import React from 'react';

interface EventProps {
  title: string;
  description: string;
  date: string;
  type: string;
  location: string;
}

const EventCard: React.FC<EventProps> = ({ title, description, date, type, location }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="bg-gray-200 p-8 flex justify-center items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <div className="p-6">
        <div className="flex justify-between items-start mb-2">
          <span className="text-purple-700 text-sm">{type}</span>
          <span className="bg-gray-100 px-2 py-1 text-sm rounded">{location}</span>
        </div>
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <div className="flex justify-between items-center">
          <div className="flex items-center text-sm text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {date}
          </div>
          <button className="text-purple-700 font-medium">Register</button>
        </div>
      </div>
    </div>
  );
};

const EventsSection: React.FC = () => {
  const events = [
    {
      title: "Women in Tech: Breaking Barriers",
      description: "Join industry leaders as they discuss strategies for women to advance in tech careers.",
      date: "May 15, 2023",
      type: "Webinar",
      location: "Virtual"
    },
    {
      title: "Resume Building for Returnees",
      description: "Learn how to showcase your skills and experience after a career break.",
      date: "May 20, 2023",
      type: "Workshop",
      location: "Bangalore"
    }
  ];

  return (
    <div className="my-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Upcoming Events</h2>
        <a href="#" className="text-purple-700 flex items-center">
          View all events
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ">
        {events.map((event, index) => (
          <EventCard key={index} {...event} />
        ))}
      </div>
    </div>
  );
};

export default EventsSection;