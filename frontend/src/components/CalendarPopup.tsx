import React, { useState } from 'react';
import { Calendar, Clock, X, Check } from 'lucide-react';

const CalendarPopup: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('15:00');
  
  // Generate day cells for the current month
  const generateDays = () => {
    const date = new Date();
    const month = date.getMonth();
    const year = date.getFullYear();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-8"></div>);
    }
    
    // Day cells
    for (let i = 1; i <= daysInMonth; i++) {
      const dayDate = new Date(year, month, i);
      const isSelected = selectedDate && 
                         dayDate.getDate() === selectedDate.getDate() && 
                         dayDate.getMonth() === selectedDate.getMonth() && 
                         dayDate.getFullYear() === selectedDate.getFullYear();
      
      days.push(
        <button
          key={i}
          className={`h-8 w-8 rounded-full flex items-center justify-center text-sm ${
            isSelected 
              ? 'bg-blue-500 text-white' 
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          onClick={() => setSelectedDate(dayDate)}
        >
          {i}
        </button>
      );
    }
    
    return days;
  };
  
  // Generate time options
  const timeOptions = [];
  for (let hour = 9; hour <= 17; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const h = hour < 10 ? `0${hour}` : hour;
      const m = minute === 0 ? '00' : minute;
      timeOptions.push(`${h}:${m}`);
    }
  }
  
  const handleSchedule = () => {
    if (selectedDate) {
      console.log(`Meeting scheduled for ${selectedDate.toDateString()} at ${selectedTime}`);
      // In a real app, you would send this to your backend
      // axios.post('/api/schedule', { date: selectedDate, time: selectedTime });
    }
  };
  
  return (
    <div className="flex justify-start flex-col items-start px-2 py-4">
      <div className="flex flex-col items-start">
        <div className="max-w-[320px] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-blue-50 p-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center">
              <Calendar size={18} className="text-blue-600" />
              <span className="ml-2 font-medium text-gray-800">Schedule Meeting</span>
            </div>
            <button className="text-gray-500 hover:text-gray-700">
              <X size={18} />
            </button>
          </div>
          
          <div className="p-4">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-medium">April 2025</h3>
                <div className="flex space-x-1">
                  <button className="p-1 rounded hover:bg-gray-100">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
                    </svg>
                  </button>
                  <button className="p-1 rounded hover:bg-gray-100">
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-7 gap-1">
                {/* Day labels */}
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={day + i} className="h-8 flex items-center justify-center text-xs text-gray-500">
                    {day}
                  </div>
                ))}
                
                {/* Calendar days */}
                {generateDays()}
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm text-gray-700 mb-1">Time</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock size={16} className="text-gray-400" />
                </div>
                <select
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {timeOptions.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <button 
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center"
                onClick={handleSchedule}
                disabled={!selectedDate}
              >
                <Check size={16} className="mr-1" />
                Schedule
              </button>
            </div>
          </div>
        </div>
        <p>Helloooo nuefuid jfiorhef fhrbefg ourhf eirg of rwhger g hrgi hjgiuer ngetg hgn reg eruhg dfch fueyhf r thyru gfyrb gytgrhguehgghvm qwmuhy jghruhb jetngyrthi j ghugwkfnsdg hg ngriugiha gnuhq g</p>
        <div className="text-xs text-gray-500 mt-1 px-1">9:07 AM</div>
      </div>
      
    </div>
    
  );
};

export default CalendarPopup;
