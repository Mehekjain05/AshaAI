import React from 'react';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="text-2xl font-bold text-[#90c45c]"><a href="/">JobsForHer</a></div>
        <div className="hidden md:flex space-x-6">
          <a href="/jobs" className="text-gray-700 hover:text-[#90c45c]">Jobs</a>
          <a href="/chat" className="text-gray-700 hover:text-[#90c45c]">Chat With AshaAI</a>
          <a href="/mentors" className="text-gray-700 hover:text-[#90c45c]">Mentorship</a>
          <a href="/events" className="text-gray-700 hover:text-[#90c45c]">Events</a>
          <a href="/learning" className="text-gray-700 hover:text-[#90c45c]">Learning</a>
          <a href="/community" className="text-gray-700 hover:text-[#90c45c]">Community</a>
        </div>
        {/* <button className="bg-[#90c45c] text-white px-4 py-2 rounded-md">Sign In</button> */}
      </div>
    </nav>
  );
};

export default Navbar;
