import React from 'react';
import { FileSpreadsheet, FileText, Download } from 'lucide-react';

interface FilePreviewProps {
  filename: string;
  fileSize: string;
  fileType: 'xlsx' | 'docx';
  timestamp: string;
}

const FilePreview: React.FC<FilePreviewProps> = ({ 
  filename, 
  fileSize, 
  fileType, 
  timestamp 
}) => {
  const isExcel = fileType === 'xlsx';
  
  return (
    <div className="flex justify-start">
      <div className="flex flex-col items-start">
        <div className="max-w-[75%] bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 p-3 flex items-center justify-between border-b border-gray-200">
            <div className="flex items-center">
              {isExcel ? (
                <FileSpreadsheet size={20} className="text-green-600" />
              ) : (
                <FileText size={20} className="text-blue-600" />
              )}
              <span className="ml-2 font-medium text-gray-700">{filename}</span>
              <span className="ml-2 text-xs text-gray-500">({fileSize})</span>
            </div>
            <button 
              className="text-blue-600 hover:text-blue-800"
              onClick={() => console.log(`Download ${filename}`)}
            >
              <Download size={18} />
            </button>
          </div>
          <div className="p-3">
            <div className="text-sm text-gray-600">
              {isExcel ? (
                <div className="space-y-1">
                  <p>• Contains financial data for Q1-Q4 2024</p>
               
                </div>
              ) : (
                <div className="space-y-1">
                  <p>• Legal document: Contract Amendment</p>
                  <p>• 12 pages, requires signatures</p>
                  <p>• Shared with: Legal, Executive team</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500 mt-1 px-1">{timestamp}</div>
      </div>
    </div>
  );
};

export default FilePreview;