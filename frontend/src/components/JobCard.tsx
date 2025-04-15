import React from 'react';
import { Briefcase, MapPin, Clock, Award, Tag } from 'lucide-react';

const JobCard = ({ job }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-5 mb-4 border-l-4 border-blue-500 hover:shadow-lg transition duration-300">
      <div className="flex justify-between items-start">
        <h3 className="font-bold text-lg text-gray-800">{job.title}</h3>
        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
          {job.work_mode}
        </span>
      </div>
      
      <h4 className="text-md font-medium text-gray-700 mt-1">{job.company}</h4>
      
      <div className="mt-3 grid grid-cols-2 gap-2">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin size={16} className="mr-1" />
          <span>{job.location}</span>
        </div>
        
        <div className="flex items-center text-sm text-gray-600">
          <Clock size={16} className="mr-1" />
          <span>{job.experience}</span>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center text-sm text-gray-600 mb-2">
          <Award size={16} className="mr-1" />
          <span>Required Skills:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {job.skills.replace(/[\[\]']/g, '').split(', ').map((skill, index) => (
            <span 
              key={index} 
              className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs"
            >
              {skill.replace(/['"]/g, '')}
            </span>
          ))}
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition duration-300">
          Apply Now
        </button>
      </div>
    </div>
  );
};

export default JobCard;