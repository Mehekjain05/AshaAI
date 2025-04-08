import React from 'react';

interface SuccessStoryProps {
  name: string;
  description: string;
  testimonial: string;
}

const SuccessStory: React.FC<SuccessStoryProps> = ({ name, description, testimonial }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm">
      <div className="flex items-center mb-4">
        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold">{name}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <p className="text-gray-700 italic mb-4">"{testimonial}"</p>
      <div className="flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg key={star} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    </div>
  );
};

const SuccessStoriesSection: React.FC = () => {
  const successStories = [
    {
      name: "Sunita Rao",
      description: "Returned to work after 4 years",
      testimonial: "After taking a break to raise my children, I was struggling to find opportunities that matched my skills. JobsForHer and Asha helped me find a returnship program that valued my experience and supported my transition back to the workforce. Today, I'm leading a team at a major tech company!"
    }
  ];

  return (
    <div className="my-12">
      <h2 className="text-2xl font-bold mb-8">Success Stories</h2>
      <div className="space-y-6">
        {successStories.map((story, index) => (
          <SuccessStory key={index} {...story} />
        ))}
        <div className="flex justify-center">
          <button className="bg-purple-700 text-white px-6 py-3 rounded-md">Share Your Success Story</button>
        </div>
      </div>
    </div>
  );
};

export default SuccessStoriesSection;