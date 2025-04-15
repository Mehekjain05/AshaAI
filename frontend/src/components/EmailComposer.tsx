import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import axios from 'axios';

interface EmailComposerProps {
  initialTo?: string;
  initialSubject?: string;
  initialMessage?: string;
}

const EmailComposer: React.FC<EmailComposerProps> = ({
  initialTo = 'legal@company.com',
  initialSubject = 'Contract Review Request',
  initialMessage = 'I need the team to review the attached contract before our client meeting on Friday.',
}) => {
  const [to, setTo] = useState(initialTo);
  const [subject, setSubject] = useState(initialSubject);
  const [message, setMessage] = useState(initialMessage);

  const handleSendEmail = async () => {
    try {
      const payload = { to, subject, message };
      console.log('Sending email with:', payload);
  
      await axios.post('/api/send-email', payload); // adjust the endpoint if different
  
      alert('Email sent successfully!');
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email.');
    }
  };

  return (
    <div className="flex justify-start px-2 py-4">
      <div className="flex flex-col items-start w-full max-w-[600px]">
        <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-blue-50 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center text-blue-600">
              <Send size={18} />
              <span className="ml-2 font-semibold text-sm text-gray-800">Compose Email</span>
            </div>
            <button className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <div className="p-5 space-y-4">
            {/* To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To:</label>
              <input
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="email@example.com"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Email subject"
              />
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message:</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-2 border border-gray-300 rounded-md text-sm resize-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="Type your message here..."
              ></textarea>
            </div>
          </div>

          {/* Actions */}
          <div className="px-5 pb-4 flex justify-end space-x-3">
            <button className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-100">
              Discard
            </button>
            <button
              onClick={handleSendEmail}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md flex items-center hover:bg-blue-700"
            >
              <Send size={16} className="mr-2" />
              Send
            </button>
          </div>
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-2 ml-1">{new Date().toLocaleString()}</span>
      </div>
    </div>
  );
};

export default EmailComposer;
