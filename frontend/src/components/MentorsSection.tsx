import React from 'react';

interface MentorProps {
  name: string;
  role: string;
  company: string;
  tags: string[];
}

const MentorCard: React.FC<MentorProps> = ({ name, role, company, tags }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm flex flex-col items-center">
      <div className="w-20 h-20 bg-gray-200 rounded-full mb-4 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-center">{name}</h3>
      <p className="text-sm text-gray-600 text-center mb-3">{role} at {company}</p>
      <div className="flex flex-wrap justify-center gap-2 mb-4">
        {tags.map((tag, index) => (
          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
      <button className="w-full bg-purple-700 text-white py-2 rounded-md">Connect</button>
    </div>
  );
};

const MentorsSection: React.FC = () => {
  const mentors = [
    {
      name: "Priya Sharma",
      role: "Senior Product Manager",
      company: "Amazon",
      tags: ["Product", "Leadership"]
    },
    {
      name: "Anita Desai",
      role: "Tech Lead",
      company: "Microsoft",
      tags: ["Engineering", "Coding"]
    },
    {
      name: "Meera Patel",
      role: "HR Director",
      company: "Infosys",
      tags: ["HR", "Career Restart"]
    },
    {
      name: "Rajiv Kumar",
      role: "Founder & CEO",
      company: "TechStartup",
      tags: ["Entrepreneurship", "Funding"]
    }
  ];

  return (
    <div className="my-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold">Featured Mentors</h2>
        <a href="#" className="text-purple-700 flex items-center">
          View all mentors
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </a>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {mentors.map((mentor, index) => (
          <MentorCard key={index} {...mentor} />
        ))}
      </div>
    </div>
  );
};

export default MentorsSection;
