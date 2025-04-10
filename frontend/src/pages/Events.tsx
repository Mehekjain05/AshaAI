import React, { useState } from 'react';

interface Event {
  id: number;
  type: 'Webinar' | 'Workshop' | 'Conference';
  title: string;
  description: string;
  date: string;
  location: string;
  isFeatured?: boolean;
  daysLeft?: number;
  speakers?: number;
  sessions?: number;
  attendees?: number;
  isPast?: boolean;
  actionText?: string;
  actionLink?: string;
}

const Events: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [eventType, setEventType] = useState('All Event Types');
  const [location, setLocation] = useState('All Locations');

  // Featured event data
  const featuredEvent: Event = {
    id: 1,
    type: 'Conference',
    title: 'Women in Leadership Summit 2023',
    description: 'Join industry leaders for our annual summit focused on empowering women to take on leadership roles and navigate challenges in the workplace.',
    date: 'June 15-16, 2023',
    location: 'Hybrid (Mumbai + Virtual)',
    isFeatured: true,
    daysLeft: 15,
    speakers: 20,
    sessions: 10,
    attendees: 500,
    actionText: 'Register Now'
  };

  // Upcoming events data
  const upcomingEvents: Event[] = [
    {
      id: 2,
      type: 'Webinar',
      title: 'Women in Tech: Breaking Barriers',
      description: 'Join industry leaders as they discuss strategies for women to advance in tech careers.',
      date: 'May 15, 2023',
      location: 'Virtual',
      actionText: 'Register'
    },
    {
      id: 3,
      type: 'Workshop',
      title: 'Resume Building for Returnees',
      description: 'Learn how to showcase your skills and experience after a career break.',
      date: 'May 20, 2023',
      location: 'Bangalore',
      actionText: 'Register'
    }
  ];

  // Past events data
  const pastEvents: Event[] = [
    {
      id: 4,
      type: 'Webinar',
      title: 'Building Your Personal Brand',
      description: 'Learn how to build and promote your personal brand to advance your career.',
      date: 'April 10, 2023',
      location: 'Virtual',
      isPast: true,
      actionText: 'Watch Recording'
    },
    {
      id: 5,
      type: 'Workshop',
      title: 'Negotiating Your Salary',
      description: 'Practical strategies for negotiating your compensation package confidently.',
      date: 'March 25, 2023',
      location: 'Virtual',
      isPast: true,
      actionText: 'Access Materials'
    },
    {
      id: 6,
      type: 'Conference',
      title: 'Tech Connect 2023',
      description: 'Annual conference featuring sessions on the latest tech trends and networking.',
      date: 'February 15-16, 2023',
      location: 'Bangalore',
      isPast: true,
      actionText: 'View Gallery'
    }
  ];

  // Filter function for the search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Searching for events with:', { searchQuery, eventType, location });
    // In a real application, this would filter the events based on inputs
  };

  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Header Section */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Events & Webinars</h1>
          <p className="text-gray-600 text-lg max-w-3xl">
            Stay connected with industry experts, learn new skills, and expand your professional network
            through our events, webinars, and workshops designed specifically for women professionals.
          </p>
        </div>

        {/* Featured Event Section */}
        <div className="mb-12">
          <div className="bg-gradient-to-l from-[#67AE6E] to-black rounded-lg overflow-hidden shadow-lg">
            <div className="p-8 md:p-10 flex flex-col md:flex-row items-start">
              <div className="md:w-2/3 text-white mb-6 md:mb-0 md:pr-8">
                <span className="inline-block px-3 py-1 bg-white/20 rounded-full text-sm mb-4">
                  Featured Event
                </span>
                <h2 className="text-3xl font-bold mb-3">{featuredEvent.title}</h2>
                <p className="mb-5">{featuredEvent.description}</p>
                
                <div className="flex flex-wrap items-center mb-6">
                  <div className="flex items-center mr-8 mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{featuredEvent.date}</span>
                  </div>
                  <div className="flex items-center mb-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>{featuredEvent.location}</span>
                  </div>
                </div>
                
                <button className="bg-white text-[#90c45c] px-6 py-3 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  {featuredEvent.actionText}
                </button>
              </div>
              
              <div className="md:w-1/3 bg-[#90c45c]/10 p-6 rounded-lg backdrop-blur text-center">
                <div className="text-white text-6xl font-bold mb-1">{featuredEvent.daysLeft}</div>
                <div className="text-white text-xl mb-6">Days Left</div>
                
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-white text-xl font-bold">{featuredEvent.speakers}+</div>
                    <div className="text-white/80 text-sm">Speakers</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-white text-xl font-bold">{featuredEvent.sessions}+</div>
                    <div className="text-white/80 text-sm">Sessions</div>
                  </div>
                  <div className="bg-white/10 rounded-lg p-3">
                    <div className="text-white text-xl font-bold">{featuredEvent.attendees}+</div>
                    <div className="text-white/80 text-sm">Attendees</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filter Section */}
        <div className="mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search events..."
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#90c45c]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="md:w-1/4">
                <select
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#90c45c]"
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                >
                  <option>All Event Types</option>
                  <option>Webinar</option>
                  <option>Workshop</option>
                  <option>Conference</option>
                </select>
              </div>
              <div className="md:w-1/4">
                <select
                  className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[#90c45c]"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option>All Locations</option>
                  <option>Virtual</option>
                  <option>Mumbai</option>
                  <option>Bangalore</option>
                  <option>Delhi</option>
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  className="w-full md:w-auto bg-[#90c45c] text-white px-6 py-2 rounded-md font-medium hover:bg-[#90c45c] transition-colors"
                >
                  Filter
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {upcomingEvents.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow overflow-hidden flex">
                <div className="bg-gray-200 w-1/4 flex items-center justify-center p-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="w-3/4 p-6">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-[#90c45c] text-sm font-medium">{event.type}</span>
                    <span className="text-gray-500 text-sm">{event.location}</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center text-gray-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>{event.date}</span>
                    </div>
                    <button className="text-[#90c45c] font-medium hover:text-[#90c45c]">
                      {event.actionText}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past Events Section */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Past Events</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pastEvents.map(event => (
              <div key={event.id} className="bg-white rounded-lg shadow p-6">
                <span className="inline-block text-sm text-gray-600 mb-2">{event.type}</span>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{event.title}</h3>
                <p className="text-gray-600 mb-4">{event.description}</p>
                <div className="flex items-center text-gray-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{event.date}</span>
                </div>
                <button className="text-[#90c45c] font-medium flex items-center hover:text-[#90c45c]">
                  {event.actionText}
                  {event.actionText === 'Watch Recording' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  )}
                  {event.actionText === 'Access Materials' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                  {event.actionText === 'View Gallery' && (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Events;