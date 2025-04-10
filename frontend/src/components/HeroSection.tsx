// components/HeroSection.tsx
import React from 'react';

const HeroSection: React.FC = () => {
  return (
    <div className="bg-[#90c45c] rounded-lg mt-8 mb-12 p-10 text-white">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Meet Asha, Your Career Assistant</h1>
        <p className="text-lg mb-6">
          Your AI-powered guide to job opportunities, mentorship programs, and
          career resources tailored for women professionals.
        </p>
        <button className="bg-white text-[#90c45c] px-5 py-3 rounded-md flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-1.008A11.955 11.955 0 013 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9a1 1 0 11-2 0 1 1 0 012 0zm6 0a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
          </svg>
          <span>Chat with Asha</span>
        </button>
      </div>
    </div>
  );
};

export default HeroSection;