import React from 'react';
import { FileDigit } from 'lucide-react';
import TextToSpeechButton from '../components/TextToSpeechButton';

interface SummaryCardProps {
  title: string;
  content: React.ReactNode;
  timestamp: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, content, timestamp }) => {
  return (
    <div className="flex justify-start">
      <div className="flex flex-col items-start">
        <div className="max-w-[100%] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-blue-50 p-3 flex items-center border-b border-gray-200">
            <FileDigit size={18} className="text-blue-600" />
            <span className="ml-2 font-medium text-gray-800">{title}</span>
          </div>
          <div className="p-4">
            <p className="text-gray-700 text-sm">{content}</p>
          </div>
        </div>  
        <div className="text-xs text-gray-500 mt-1 px-1">{timestamp}</div>
      </div>
    </div>
  );
};

export default SummaryCard;