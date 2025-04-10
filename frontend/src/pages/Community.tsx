import React, { useState } from 'react';

interface User {
  id: number;
  name: string;
  avatar: string;
  bio: string;
}

interface Post {
  id: number;
  author: User;
  title: string;
  content: string;
  tags: string[];
  timestamp: string;
  replies: number;
  views: number;
}

interface Discussion {
  id: number;
  title: string;
  description: string;
}

const Community: React.FC = () => {
  const [activeTab, setActiveTab] = useState('post');
  const [tags] = useState(['study-group', 'share-insight', 'help-question']);
  const [inputValue, setInputValue] = useState('');
  
  const user: User = {
    id: 1,
    name: 'Mikey Jonah',
    avatar: '/avatar.jpg',
    bio: 'Talks about design & productivity'
  };
  
  const [posts] = useState<Post[]>([
    {
      id: 1,
      author: user,
      title: 'Title of the discussion will be placed ver here',
      content: 'That pro will be a game-changer land it in region keep it lean this proposal is a win-win situation which will cause a stellar paradigm shift and produce a multi-fold increase in deliverables',
      tags: ['study-group', 'share-insight', 'help-question'],
      timestamp: '2d ago',
      replies: 28,
      views: 875
    },
    {
      id: 2,
      author: user,
      title: 'Title of the discussion will be placed ver here',
      content: 'That pro will be a game-changer land it in region keep it lean this proposal is a win-win situation which will cause a stellar paradigm shift and produce a multi-fold increase in deliverables',
      tags: [],
      timestamp: '2d ago',
      replies: 0,
      views: 0
    }
  ]);
  
  const [recommendedTopics] = useState([
    'Programming', 'Copywriting', 'Product design', 
    'Machine learning', 'Productivity'
  ]);
  
  const [topDiscussions] = useState<Discussion[]>([
    {
      id: 1,
      title: 'Share your best study habits or learn from others. How do you stay focused during study sessions?',
      description: 'Seek feedback on your recent assignment'
    },
    {
      id: 2,
      title: 'Seek feedback on your recent assignment',
      description: 'Share challenges you faced and ask for suggestions for improvement.'
    },
    {
      id: 3,
      title: 'Recommend and discuss a book or article',
      description: 'related to the course material. What insights did you gain?'
    }
  ]);
  
  const [peopleToFollow] = useState<User[]>([
    {...user, id: 2},
    {...user, id: 3},
    {...user, id: 4}
  ]);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="flex-1 border-r border-gray-200">
        {/* Header */}
        <div className="border-b border-gray-200 p-4 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <span className="text-[#90c45c] text-2xl">🔥</span>
            <h1 className="text-xl font-semibold">Community</h1>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search"
                className="pl-8 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#90c45c]"
              />
              <svg className="w-4 h-4 absolute left-3 top-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button className="bg-[#90c45c] text-white p-2 rounded-full">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* New Post Box */}
        <div className="p-4 bg-white border-b border-gray-200">
          <div className="mb-4">
            <p className="font-medium text-gray-800 mb-2">Hey everyone! 🎉</p>
            <p className="text-gray-700 mb-2">
              I'm thrilled to share some exciting news with you all. Starting next week, we'll be launching a brand new series on our blog focusing on [your topic of interest]. 📝
            </p>
            <p className="text-gray-700 mb-2">
              Get ready for insightful articles, expert interviews, and valuable tips that will [mention the benefits]. 📚
            </p>
            <p className="text-gray-700 mb-2">
              Your feedback has always been our driving force, so feel free to drop your thoughts and suggestions in the comments. Let's make this journey together! 🚀
            </p>
            <p className="text-gray-700">
              Stay tuned for more updates! 📣
            </p>
          </div>

          <div className="mb-3">
            <div className="text-sm text-gray-500 mb-2">Add tags:</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
              <div className="relative">
                <button className="flex items-center text-sm text-[#90c45c] bg-orange-50 hover:bg-orange-100 px-3 py-1 rounded-full">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Tags
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex space-x-4">
              <button className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>
              <button className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </button>
            </div>
            <button className="bg-[#90c45c] hover:bg-orange-600 text-white px-4 py-2 rounded-md">
              Post
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-white">
          <button
            onClick={() => setActiveTab('post')}
            className={`flex items-center px-4 py-3 text-sm font-medium ${
              activeTab === 'post' ? 'text-[#90c45c] border-b-2 border-[#90c45c]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Post
          </button>
          <button
            onClick={() => setActiveTab('discussion')}
            className={`flex items-center px-4 py-3 text-sm font-medium ${
              activeTab === 'discussion' ? 'text-[#90c45c] border-b-2 border-[#90c45c]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
            Discussion
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center px-4 py-3 text-sm font-medium ${
              activeTab === 'resources' ? 'text-[#90c45c] border-b-2 border-[#90c45c]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0h10" />
            </svg>
            Resources
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`flex items-center px-4 py-3 text-sm font-medium ${
              activeTab === 'announcements' ? 'text-[#90c45c] border-b-2 border-[#90c45c]' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
            Announcements
          </button>
        </div>

        {/* Posts List */}
        <div className="bg-white">
          {posts.map((post) => (
            <div key={post.id} className="p-4 border-b border-gray-200">
              {/* Post Header */}
              <div className="flex items-center mb-3">
                <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full bg-gray-300" />
                <div className="ml-2">
                  <div className="text-sm font-medium">By: {post.author.name}</div>
                </div>
                <div className="ml-auto text-sm text-gray-500">{post.timestamp}</div>
              </div>
              
              {/* Post Content */}
              <div className="mb-3">
                <h3 className="text-lg font-semibold mb-2">{post.title}</h3>
                <p className="text-gray-700">{post.content}</p>
              </div>
              
              {/* Post Tags */}
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 0 && (
                    <span className="text-gray-500 text-sm flex items-center">
                      <span>+2 more tags</span>
                      <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </div>
              )}
              
              {/* Post Stats */}
              {post.replies > 0 && (
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <span className="mr-3">{post.replies} replies</span>
                  <span>•</span>
                  <svg className="w-4 h-4 mx-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{post.views} views</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-full md:w-80 bg-white border-l border-gray-200">
        {/* Top Discussion */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold mb-4">Top discussion this week 🔥</h2>
          
          {topDiscussions.map((discussion) => (
            <div key={discussion.id} className="mb-4">
              <p className="text-sm text-gray-700 mb-1">{discussion.title}</p>
              {discussion.description && (
                <p className="text-xs text-gray-500">{discussion.description}</p>
              )}
              <div className="mt-2">
                <a href="#" className="text-xs text-gray-500 flex items-center">
                  Details
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </div>
          ))}
        </div>
        
        {/* Recommended Topics */}
        <div className="p-4 border-b border-gray-200">
          <h2 className="font-semibold mb-4">Recommended topics</h2>
          <div className="flex flex-wrap gap-2 mb-4">
            {recommendedTopics.map((topic) => (
              <span key={topic} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">
                {topic}
              </span>
            ))}
          </div>
          <a href="#" className="text-[#90c45c] text-sm">See more topics</a>
        </div>
        
        {/* People to Follow */}
        <div className="p-4">
          <h2 className="font-semibold mb-4">People to follow</h2>
          {peopleToFollow.map((person) => (
            <div key={person.id} className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <img src={person.avatar} alt={person.name} className="w-8 h-8 rounded-full bg-gray-300" />
                <div className="ml-3">
                  <div className="text-sm font-medium">{person.name}</div>
                  <div className="text-xs text-gray-500">{person.bio}</div>
                </div>
              </div>
              <button className="border border-gray-300 text-gray-700 text-xs rounded-full px-3 py-1 hover:bg-gray-50">
                Follow
              </button>
            </div>
          ))}
          <a href="#" className="text-[#90c45c] text-sm">See more suggestions</a>
        </div>
      </div>
    </div>
  );
};

export default Community;