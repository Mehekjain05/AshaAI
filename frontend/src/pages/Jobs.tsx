import React, { useState } from 'react';

interface JobPosting {
  id: number;
  title: string;
  company: string;
  location: string;
  experience: string;
  workType: string;
  tags: string[];
  salary: string;
  jobType: string;
  postedTime: string;
}

const Jobs: React.FC = () => {
  const [searchKeywords, setSearchKeywords] = useState('');
  const [searchLocation, setSearchLocation] = useState('');
  const [jobType, setJobType] = useState('All Types');

  // Mock data
  const jobListings: JobPosting[] = [
    {
      id: 1,
      title: 'Senior UX Designer',
      company: 'Adobe Systems',
      location: 'Bangalore',
      experience: '5-8 yrs',
      workType: 'Remote',
      tags: ['UI/UX'],
      salary: '₹18-25 LPA',
      jobType: 'Full-time',
      postedTime: 'Posted 2 days ago'
    },
    {
      id: 2,
      title: 'Project Manager',
      company: 'Accenture',
      location: 'Mumbai',
      experience: '3+ yrs',
      workType: 'Hybrid',
      tags: ['Management'],
      salary: '₹12-18 LPA',
      jobType: 'Full-time',
      postedTime: 'Posted 1 week ago'
    },
    {
      id: 3,
      title: 'Content Specialist',
      company: 'HCL Technologies',
      location: 'Delhi NCR',
      experience: '1-3 yrs',
      workType: 'Work from home',
      tags: ['Content'],
      salary: '₹6-10 LPA',
      jobType: 'Part-time',
      postedTime: 'Posted 3 days ago'
    }
  ];

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real application, this would filter the jobs based on inputs
    console.log('Searching for:', { searchKeywords, searchLocation, jobType });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Job Search Section */}
        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-3xl font-bold text-gray-800">Find Your Dream Job</h2>
            <p className="text-gray-600 mt-2">
              Discover opportunities that match your skills, experience, and career aspirations. Filter by
              location, job type, and more.
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow p-6">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="keywords" className="block text-gray-700 mb-2">Keywords</label>
                <input
                  type="text"
                  id="keywords"
                  placeholder="Job title, skills, or company"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#90c45c]"
                  value={searchKeywords}
                  onChange={(e) => setSearchKeywords(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="location" className="block text-gray-700 mb-2">Location</label>
                <input
                  type="text"
                  id="location"
                  placeholder="City, state, or remote"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#90c45c]"
                  value={searchLocation}
                  onChange={(e) => setSearchLocation(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="jobType" className="block text-gray-700 mb-2">Job Type</label>
                <select
                  id="jobType"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#90c45c]"
                  value={jobType}
                  onChange={(e) => setJobType(e.target.value)}
                >
                  <option>All Types</option>
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Internship</option>
                </select>
              </div>
              <div className="md:col-span-3 flex justify-end mt-2">
                <button
                  type="submit"
                  className="bg-[#90c45c] text-white px-6 py-2 rounded-md font-medium hover:bg-[#90c45c] transition-colors"
                >
                  Search Jobs
                </button>
              </div>
            </form>
          </div>
        </section>

        {/* Job Listings Section */}
        <section>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Available Positions</h3>
            <span className="text-gray-600">Showing {jobListings.length} jobs</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobListings.map((job) => (
              <div key={job.id} className="bg-white rounded-lg shadow border overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-gray-500 p-3 bg-gray-100 rounded-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <span className={`text-sm font-medium ${job.jobType === 'Full-time' ? 'text-[#90c45c]' : 'text-[#90c45c]'}`}>
                      {job.jobType}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-1">{job.title}</h3>
                  <p className="text-gray-600 mb-4">{job.company} - {job.location}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {job.experience}
                    </span>
                    <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                      {job.workType}
                    </span>
                    {job.tags.map((tag, index) => (
                      <span key={index} className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm">
                        {tag}
                      </span>
                    ))}
                  </div>
                  
                  <div className="flex justify-between items-center mt-auto pt-2 border-t">
                    <span className="font-medium text-gray-800">{job.salary}</span>
                    <span className="text-sm text-gray-500">{job.postedTime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Jobs;