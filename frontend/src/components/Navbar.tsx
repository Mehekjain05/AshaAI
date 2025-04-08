import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-purple-700"><a href="/">JobsForHer</a></div>
        <div className="hidden md:flex space-x-6">
          <a href="/jobs" className="text-gray-700 hover:text-purple-700">Jobs</a>
          <a href="/mentors" className="text-gray-700 hover:text-purple-700">Mentorship</a>
          <a href="/events" className="text-gray-700 hover:text-purple-700">Events</a>
          <a href="#" className="text-gray-700 hover:text-purple-700">Learning</a>
          <a href="#" className="text-gray-700 hover:text-purple-700">Community</a>
        </div>
        <button className="bg-purple-700 text-white px-4 py-2 rounded-md">Sign In</button>
      </div>
    </nav>
  );
};

export default Navbar;
