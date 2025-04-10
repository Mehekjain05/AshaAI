import React from 'react';

interface MentorshipProgram {
  id: number;
  title: string;
  description: string;
  features: string[];
  hasApplyButton?: boolean;
  buttonText?: string;
}

interface Mentor {
  id: number;
  name: string;
  position: string;
  company: string;
  tags: string[];
  imageUrl?: string;
}

const Mentor: React.FC = () => {
  // Mentorship programs data
  const mentorshipPrograms: MentorshipProgram[] = [
    {
      id: 1,
      title: "1:1 Mentorship",
      description: "Connect directly with a mentor for personalized guidance and support.",
      features: [
        "4 one-hour sessions per month",
        "Unlimited email support",
        "Career roadmap planning"
      ],
      hasApplyButton: true,
      buttonText: "Apply Now"
    },
    {
      id: 2,
      title: "Group Mentorship",
      description: "Join a small group of peers with a dedicated mentor for collaborative learning.",
      features: [
        "Weekly 90-minute group sessions",
        "Peer networking opportunities",
        "Shared resources and materials"
      ],
      hasApplyButton: true,
      buttonText: "Join Group"
    },
    {
      id: 3,
      title: "Career Restart Program",
      description: "Specialized mentoring for women returning to the workforce after a break.",
      features: [
        "6-week structured program",
        "Skill refresher workshops",
        "Returnship opportunities"
      ],
      hasApplyButton: true,
      buttonText: "Apply Now"
    }
  ];

  // Featured mentors data
  const featuredMentors: Mentor[] = [
    {
      id: 1,
      name: "Priya Sharma",
      position: "Senior Product Manager",
      company: "Amazon",
      tags: ["Product", "Leadership"],
      imageUrl: "/placeholder-avatar.png"
    },
    {
      id: 2,
      name: "Anita Desai",
      position: "Tech Lead",
      company: "Microsoft",
      tags: ["Engineering", "Coding"],
      imageUrl: "/placeholder-avatar.png"
    },
    {
      id: 3,
      name: "Meera Patel",
      position: "HR Director",
      company: "Infosys",
      tags: ["HR", "Career Restart"],
      imageUrl: "/placeholder-avatar.png"
    },
    {
      id: 4,
      name: "Rajiv Kumar",
      position: "Founder & CEO",
      company: "TechStartup",
      tags: ["Entrepreneurship", "Funding"],
      imageUrl: "/placeholder-avatar.png"
    }
  ];

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header section with title and description */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Find Your Mentor</h1>
          <p className="text-gray-600 text-lg max-w-3xl">
            Connect with experienced professionals who can guide you on your career journey. Get
            personalized advice, industry insights, and support for your professional growth.
          </p>
        </div>

        {/* Mentorship Programs section */}
        <div className="mb-16">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Mentorship Programs</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentorshipPrograms.map((program) => (
              <div key={program.id} className="bg-white rounded-lg shadow p-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{program.title}</h3>
                <p className="text-gray-600 mb-4">{program.description}</p>
                
                <ul className="mb-6">
                  {program.features.map((feature, index) => (
                    <li key={index} className="flex items-start mb-3">
                      <span className="text-green-500 mr-2 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {program.hasApplyButton && (
                  <button className="w-full [#90c45c] text-white py-3 rounded-lg font-medium hover:bg-[#90c45c] transition-colors">
                    {program.buttonText || "Apply Now"}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Featured Mentors section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Mentors</h2>
            <span className="text-gray-600">Showing {featuredMentors.length} mentors</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredMentors.map((mentor) => (
              <div key={mentor.id} className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
                <div className="w-24 h-24 rounded-full bg-gray-200 mb-4 flex items-center justify-center">
                  {mentor.imageUrl ? (
                    <img 
                      src={mentor.imageUrl} 
                      alt={mentor.name} 
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-800 text-center">{mentor.name}</h3>
                <p className="text-gray-600 text-center mb-1">{mentor.position} at {mentor.company}</p>
                
                <div className="flex flex-wrap justify-center gap-2 my-3">
                  {mentor.tags.map((tag, index) => (
                    <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <button className="w-full [#90c45c] text-white py-2 rounded-lg font-medium mt-auto hover:bg-[#90c45c] transition-colors">
                  Connect
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Mentor;