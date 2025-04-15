import React from 'react';
import { FileText, Download } from 'lucide-react';

interface PDFPreviewProps {
  filename: string;
  fileSize: string;
  timestamp: string;
}

const PDFPreview: React.FC<PDFPreviewProps> = ({ filename, fileSize, timestamp }) => {
  return (
    <div className="flex justify-start px-2 py-1">
      <div className="flex flex-col items-start">
        <div className="w-full max-w-sm bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-gray-100 px-4 py-3 flex items-center justify-between border-b border-gray-300">
            <div className="flex items-center space-x-2">
              <FileText size={20} className="text-red-500" />
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800">{filename}</span>
                <span className="text-xs text-gray-500">{fileSize}</span>
              </div>
            </div>
            <button
              className="text-blue-600 hover:text-blue-800 transition"
              onClick={() => console.log(`Download ${filename}`)}
              title="Download PDF"
            >
              <Download size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="flex items-center justify-center bg-gray-50 h-44">
            <div className="bg-red-100 text-red-700 w-20 h-24 flex items-center justify-center rounded-lg shadow-inner font-bold text-lg tracking-wider">
              PDF
            </div>
          </div>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 mt-2 px-1">{timestamp}</div>
      </div>
    </div>
  );
};

export default PDFPreview;
