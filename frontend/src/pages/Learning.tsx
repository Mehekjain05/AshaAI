import React, { useState } from 'react';

interface Course {
  id: number;
  title: string;
  description: string;
  duration: string;
  price: string;
  rating: number;
  isPopular?: boolean;
  isNew?: boolean;
}

interface LearningTrack {
  id: number;
  title: string;
  items: string[];
}

interface Resource {
  id: number;
  title: string;
  description: string;
  linkText: string;
  icon: string;
}

const Learning: React.FC = () => {
  const [courses] = useState<Course[]>([
    {
      id: 1,
      title: "Effective Communication Skills",
      description: "Master the art of professional communication to enhance your leadership presence and career growth.",
      duration: "8 Weeks",
      price: "₹2,499",
      rating: 5,
      isPopular: true
    },
    {
      id: 2,
      title: "Data Science Fundamentals",
      description: "Learn the basics of data analysis, visualization, and machine learning for the modern workplace.",
      duration: "6 Weeks",
      price: "₹3,999",
      rating: 4
    },
    {
      id: 3,
      title: "Leadership for Women",
      description: "Develop leadership skills designed to help women overcome workplace barriers and advance their careers.",
      duration: "4 Weeks",
      price: "₹1,999",
      rating: 5,
      isNew: true
    }
  ]);

  const [tracks] = useState<LearningTrack[]>([
    {
      id: 1,
      title: "Technical Skills Development",
      items: ["Full-Stack Web Development", "Data Science & Analytics", "Cloud Computing"]
    },
    {
      id: 2,
      title: "Leadership & Management",
      items: ["People Management", "Strategic Decision Making", "Executive Presence"]
    }
  ]);

  const [resources] = useState<Resource[]>([
    {
      id: 1,
      title: "E-Books & Guides",
      description: "Downloadable resources covering topics from career planning to industry-specific knowledge.",
      linkText: "Browse Library",
      icon: "book"
    },
    {
      id: 2,
      title: "Webinar Recordings",
      description: "Access recordings of past webinars on professional development, industry trends, and career strategies.",
      linkText: "View Recordings",
      icon: "video"
    },
    {
      id: 3,
      title: "Career Advice Articles",
      description: "Read expert articles and tips on navigating career challenges, skill development, and work-life balance.",
      linkText: "Read Articles",
      icon: "thumbs-up"
    }
  ]);

  const renderRatingStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <svg 
            key={i}
            className={`w-5 h-5 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor" 
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderResourceIcon = (icon: string) => {
    switch (icon) {
      case 'book':
        return (
          <div className="bg-[#90c45c]-700 rounded-full w-12 h-12 flex items-center justify-center">
            <span className="sr-only">Book icon</span>
          </div>
        );
      case 'video':
        return (
          <div className="bg-gray-200 rounded-full w-12 h-12 flex items-center justify-center">
            <span className="sr-only">Video icon</span>
          </div>
        );
      case 'thumbs-up':
        return (
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905v.714L7.5 9h-3a2 2 0 00-2 2v.5" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 bg-gray-50">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Learning Resources</h1>
        <p className="text-lg text-gray-700">
          Enhance your skills and stay ahead in your career with our curated learning resources, courses,
          and development programs designed for women professionals.
        </p>
      </div>

      {/* Featured Courses */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Featured Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => (
            <div key={course.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Course Image */}
              <div className="relative h-48 bg-gradient-to-r from-[#90c45c]-700 to-white">
                {course.isPopular && (
                  <span className="absolute top-4 left-4 bg-white text-[#90c45c]-700 text-sm font-medium py-1 px-3 rounded-full">
                    Popular
                  </span>
                )}
                {course.isNew && (
                  <span className="absolute top-4 right-4 bg-white text-gray-800 text-sm font-medium py-1 px-3 rounded-full">
                    New
                  </span>
                )}
                {course.id === 1 && (
                  <div className="absolute left-12 top-16 bg-[#90c45c]-200 bg-opacity-50 rounded-full p-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-600 text-sm">{course.duration}</span>
                  {renderRatingStars(course.rating)}
                </div>
                <h3 className="font-bold text-xl mb-2">{course.title}</h3>
                <p className="text-gray-600 mb-6">{course.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[#90c45c]-700 font-bold text-lg">{course.price}</span>
                  <button className="bg-[#90c45c]-700 text-white py-2 px-4 rounded hover:bg-[#90c45c]-800 transition">
                    Enroll Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Tracks */}
      <div className="mb-16">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Learning Tracks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tracks.map(track => (
            <div key={track.id} className="bg-white rounded-lg shadow-md p-6 border-l-4 border-[#90c45c]-700">
              <h3 className="font-bold text-xl mb-3">{track.title}</h3>
              <p className="text-gray-600 mb-6">
                {track.id === 1 ? (
                  "Comprehensive learning paths for women looking to build or enhance technical expertise in fields like programming, data analysis, and IT."
                ) : (
                  "Develop the strategic and interpersonal skills needed to lead teams, manage projects, and advance to executive roles."
                )}
              </p>
              <ul className="space-y-3 mb-6">
                {track.items.map((item, index) => (
                  <li key={index} className="flex items-start">
                    <svg className="w-5 h-5 text-[#90c45c]-700 mr-2 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
              <a href="#" className="text-[#90c45c]-700 font-medium flex items-center hover:underline">
                Explore Track
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Free Resources */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Free Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {resources.map(resource => (
            <div key={resource.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-4">
                {renderResourceIcon(resource.icon)}
              </div>
              <h3 className="font-bold text-xl mb-3">{resource.title}</h3>
              <p className="text-gray-600 mb-6">{resource.description}</p>
              <a href="#" className="text-[#90c45c]-700 font-medium flex items-center hover:underline">
                {resource.linkText}
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Learning;