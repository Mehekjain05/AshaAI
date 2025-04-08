import React from 'react';

interface EventProps {
  title: string;
  description: string;
  date: string;
  type: string;
  location: string;
  imageUrl?: string;
}

const EventCard: React.FC<EventProps> = ({ title, description, date, type, location, imageUrl }) => {
  const eventTypeColors: Record<string, string> = {
    'Webinar': 'bg-indigo-100 text-indigo-800',
    'Workshop': 'bg-emerald-100 text-emerald-800',
    'Conference': 'bg-amber-100 text-amber-800',
    'Meetup': 'bg-rose-100 text-rose-800',
  };

  const typeColorClass = eventTypeColors[type] || 'bg-purple-100 text-purple-800';

  return (
    <div className="group transition-all duration-300 hover:translate-y-1">
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 transition-all duration-300 hover:shadow-lg">
        <div className="bg-gradient-to-br from-[#8F87F1] to-[#C68EFD] p-8 flex justify-center items-center relative overflow-hidden h-48">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
          ) : (
            <div className="absolute inset-0 opacity-20">
              <div className="absolute inset-0 bg-repeat opacity-10" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E\")" }}></div>
            </div>
          )}
          <div className="absolute inset-0 flex justify-center items-center">
            <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex justify-center items-center backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />           </svg>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
            <h3 className="text-lg md:text-xl font-bold text-white">{title}</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-3">
            <span className={`${typeColorClass} text-xs font-medium px-2.5 py-1 rounded-full`}>{type}</span>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-gray-600 text-sm ml-1">{location}</span>
            </div>
          </div>
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">{description}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center text-sm text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {date}
            </div>
            <button className="text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-300 text-sm font-medium px-4 py-2 rounded-lg">Register</button>
          </div>
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
      location: "Virtual",
      imageUrl: ""
    },
    {
      title: "Resume Building for Returnees",
      description: "Learn how to showcase your skills and experience after a career break.",
      date: "May 20, 2023",
      type: "Workshop",
      location: "Bangalore",
      imageUrl: ""
    },
    {
      title: "Tech Leadership Summit",
      description: "Network with tech leaders and learn about emerging trends in technology leadership.",
      date: "June 5, 2023",
      type: "Conference",
      location: "New York",
      imageUrl: ""
    },
    {
      title: "Coding Bootcamp for Beginners",
      description: "A hands-on session to learn the basics of coding and development.",
      date: "June 12, 2023",
      type: "Meetup",
      location: "London",
      imageUrl: ""
    }
  ];

  return (
    <div className="my-12 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Upcoming Events</h2>
          <p className="text-gray-600 mt-2">Join our community events and enhance your skills</p>
        </div>
        <a href="#" className="mt-4 md:mt-0 text-purple-700 font-medium flex items-center group hover:text-purple-800 transition-colors duration-300">
          View all events
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1 group-hover:translate-x-1 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {events.map((event, index) => (
          <EventCard key={index} {...event} />
        ))}
      </div>
    </div>
  );
};

export default EventsSection;