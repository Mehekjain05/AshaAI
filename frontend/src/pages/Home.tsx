import React from 'react';
import HeroSection from '../components/HeroSection';
import FeatureSection from '../components/FeatureSection';
import JobsSection from '../components/JobsSection';
import EventsSection from '../components/EventsSection';
import MentorsSection from '../components/MentorsSection';
import SuccessStoriesSection from '../components/SuccessStoriesSection';
import ChatbotWidget from '../components/ChatbotWidget';
import '../App.css';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4">
        <HeroSection />
        <FeatureSection />
        <JobsSection />
        <EventsSection />
        <MentorsSection />
        <SuccessStoriesSection />
      </div>
      <ChatbotWidget />
    </div>
  );
};

export default Home;