import React from 'react';

interface JobProps {
  title: string;
  company: string;
  location: string;
  experience: string;
  workType: string;
  tags: string[];
  salary: string;
  postedTime: string;
  jobType: string;
}

const JobCard: React.FC<JobProps> = ({ 
  title, company, location, experience, workType, tags, salary, postedTime, jobType 
}) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-start mb-4">
        <div className="bg-gray-200 p-4 rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="ml-4 flex-grow">
          <div className="flex justify-between">
            <h3 className="text-lg font-semibold">{title}</h3>
            <span className="text-purple-700 text-sm font-medium">{jobType}</span>
          </div>
          <p className="text-gray-600">{company} - {location}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mb-3">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{experience}</span>
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{workType}</span>
        {tags.map((tag, index) => (
          <span key={index} className="text-xs bg-gray-100 px-2 py-1 rounded">{tag}</span>
        ))}
      </div>
      <div className="flex justify-between items-center">
        <span className="font-medium">{salary}</span>
        <span className="text-sm text-gray-500">Posted {postedTime}</span>
      </div>
    </div>
  );
};

const JobsSection: React.FC = () => {
    const jobs = [
      {
        title: "Senior UX Designer",
        company: "Adobe Systems",
        location: "Bangalore",
        experience: "5-8 yrs",
        workType: "Remote",
        tags: ["UI/UX"],
        salary: "₹18-25 LPA",
        postedTime: "2 days ago",
        jobType: "Full-time"
      },
      {
        title: "Project Manager",
        company: "Accenture",
        location: "Mumbai",
        experience: "3+ yrs",
        workType: "Hybrid",
        tags: ["Management"],
        salary: "₹12-18 LPA",
        postedTime: "1 week ago",
        jobType: "Full-time"
      },
      {
        title: "Content Specialist",
        company: "HCL Technologies",
        location: "Delhi NCR",
        experience: "1-3 yrs",
        workType: "Work from home",
        tags: ["Content"],
        salary: "₹6-10 LPA",
        postedTime: "3 days ago",
        jobType: "Part-time"
      }
    ];
  
    return (
      <div className="my-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">Featured Opportunities</h2>
          <a href="#" className="text-purple-700 flex items-center">
            View all jobs 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job, index) => (
            <JobCard key={index} {...job} />
          ))}
        </div>
      </div>
    );
  };

export default JobsSection;