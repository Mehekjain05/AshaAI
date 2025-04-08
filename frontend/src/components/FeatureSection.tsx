import React from 'react';
import '../App.css'

const FeatureSection: React.FC = () => {
  const features = [
    {
      title: "Job Search",
      description: "Find opportunities matching your skills, location, and career stage."
    },
    {
      title: "Mentorship",
      description: "Connect with mentors who can guide you on your professional journey."
    },
    {
      title: "Events & Webinars",
      description: "Discover networking events and learning opportunities."
    },
    {
      title: "Career Restart",
      description: "Get personalized guidance for returning to work after a break."
    }
  ];

  return (
    <div className="my-12">
      <h2 className="text-2xl font-bold mb-8">How Asha Can Help You</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feature, index) => (
          <div key={index} className="card">
            <div className="content">
              <div className="front">
                <div className="front-content">
                  <p className="text-black">{feature.description}</p>
                </div>
              </div>
              <div className="back">
                <div className="back-content">
                  <strong>{feature.title}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>

  );
};

export default FeatureSection;