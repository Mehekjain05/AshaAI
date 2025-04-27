// Dashboard.tsx
import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, PieChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Bar, Line, Pie, Cell } from 'recharts';
import { ArrowUp, ArrowDown, Clock, Users, Search, Briefcase } from 'lucide-react';

// Define TypeScript interfaces
interface QueryData {
  user_id: string;
  user_query: string;
  query_type: string;
  page_visited: string;
  response_time_ms: number;
  query_id: string;
}

interface ApiResponse {
  success: boolean;
  data: QueryData[];
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: number;
  trendLabel?: string;
  bgColor: string;
}

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QueryData[]>([]);
  
  // Fetch data from backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Replace with your actual API endpoint
        const response = await fetch('/api/admin/dashboard');
        const result: ApiResponse = await response.json();
        
        if (result.success) {
          setData(result.data);
        } else {
          throw new Error('Failed to fetch data');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  // Calculate metrics
  const totalQueries = data.length;
  const avgResponseTime = data.length > 0 
    ? Math.round(data.reduce((acc, item) => acc + item.response_time_ms, 0) / data.length) 
    : 0;
  
  const queryTypes = data.reduce((acc, item) => {
    acc[item.query_type] = (acc[item.query_type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const jobQueries = queryTypes['job'] || 0;
  const otherQueries = queryTypes['other'] || 0;
  const careerGuidanceQueries = queryTypes['career_guidance'] || 0;
  
  // Chart data
  const queryTypeData = Object.entries(queryTypes).map(([name, value]) => ({ name, value }));
  
  const responseTimeData = data.map((item, index) => ({
    name: `Query ${index + 1}`,
    responseTime: item.response_time_ms / 1000, // Convert to seconds
  }));

  // MetricCard component
  const MetricCard: React.FC<MetricCardProps> = ({ title, value, icon, trend, trendLabel, bgColor }) => (
    <div className={`${bgColor} rounded-lg shadow-lg p-6 flex flex-col`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-gray-700 font-medium">{title}</h3>
        <div className="p-2 bg-white rounded-lg">{icon}</div>
      </div>
      <div className="flex flex-col">
        <span className="text-2xl font-bold text-gray-800">{value}</span>
        {trend !== undefined && (
          <div className="flex items-center mt-2">
            {trend > 0 ? (
              <ArrowUp className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowDown className="w-4 h-4 text-red-500" />
            )}
            <span className={`text-xs ml-1 ${trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
              {Math.abs(trend)}% {trendLabel}
            </span>
          </div>
        )}
      </div>
    </div>
  );
  
  if (loading) return <div className="flex justify-center items-center h-screen">Loading dashboard data...</div>;
  if (error) return <div className="text-red-500 text-center mt-10">Error: {error}</div>;
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">User Query Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Insights from user interactions with the chatbot</p>
        </header>
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total Queries"
            value={totalQueries}
            icon={<Search className="w-6 h-6 text-blue-500" />}
            trend={5.7}
            trendLabel="vs last week"
            bgColor="bg-blue-50"
          />
          <MetricCard
            title="Avg Response Time"
            value={`${(avgResponseTime / 1000).toFixed(2)}s`}
            icon={<Clock className="w-6 h-6 text-yellow-500" />}
            trend={-2.3}
            trendLabel="vs last week"
            bgColor="bg-yellow-50"
          />
          <MetricCard
            title="Job Queries"
            value={jobQueries}
            icon={<Briefcase className="w-6 h-6 text-green-500" />}
            trend={8.2}
            trendLabel="vs last week"
            bgColor="bg-green-50"
          />
          <MetricCard
            title="Unique Users"
            value={new Set(data.map(item => item.user_id)).size}
            icon={<Users className="w-6 h-6 text-purple-500" />}
            trend={3.1}
            trendLabel="vs last week"
            bgColor="bg-purple-50"
          />
        </div>
        
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Query Types Distribution</h2>
            <div className="h-80">
              <PieChart width={500} height={300}>
                <Pie
                  data={queryTypeData}
                  cx={250}
                  cy={150}
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {queryTypeData.map((entry, index) => {
                    const colors = ['#4361ee', '#ef476f', '#06d6a0', '#ffd166'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Response Time (seconds)</h2>
            <div className="h-80">
              <LineChart
                width={500}
                height={300}
                data={responseTimeData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}s`, 'Response Time']} />
                <Legend />
                <Line type="monotone" dataKey="responseTime" stroke="#4361ee" activeDot={{ r: 8 }} />
              </LineChart>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Query Types by Count</h2>
          <div className="h-80">
            <BarChart
              width={1000}
              height={300}
              data={queryTypeData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#4361ee" />
            </BarChart>
          </div>
        </div>
        
        {/* Data Table */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Recent User Queries</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Page</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.slice(0, 10).map((item, index) => (
                  <tr key={item.query_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.user_id.replace('user-123', `user-${Math.floor(Math.random() * 9000) + 1000}`)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.user_query.length > 30 ? `${item.user_query.substring(0, 30)}...` : item.user_query}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.query_type === 'job' ? 'bg-green-100 text-green-800' :
                        item.query_type === 'career_guidance' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {item.query_type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.page_visited}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(item.response_time_ms / 1000).toFixed(2)}s
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                Showing <span className="font-medium">1</span> to <span className="font-medium">10</span> of <span className="font-medium">{data.length}</span> results
              </div>
              <div className="flex-1 flex justify-end">
                <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Previous
                </button>
                <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard