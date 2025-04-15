// GDrivePicker.tsx
import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';

interface DriveFile {
  id: string;
  name: string;
}

interface GDrivePickerProps {
  onFilesSelected: (files: DriveFile[]) => void;
}

const GDrivePicker: React.FC<GDrivePickerProps> = ({ onFilesSelected }) => {
  const [loading, setLoading] = useState(false);
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const login = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const accessToken = tokenResponse.access_token;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          'https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name)',
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        const data = await response.json();
        setDriveFiles(data.files || []);
      } catch (err) {
        console.error('Error fetching Google Drive files:', err);
        setError('Failed to load files from Google Drive.');
      } finally {
        setLoading(false);
      }
    },
    onError: (errorResponse) => {
      console.error('Google Login Failed:', errorResponse);
      setError('Google login failed.');
    },
    scope: 'https://www.googleapis.com/auth/drive.readonly',
    flow: 'implicit', // Use 'auth-code' if you plan to exchange code on the server side
  });

  // Trigger login when component mounts
  useEffect(() => {
    login();
  }, [login]);

  const toggleSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const updated = new Set(prev);
      if (updated.has(fileId)) {
        updated.delete(fileId);
      } else {
        updated.add(fileId);
      }
      return updated;
    });
  };

  const handleImport = () => {
    const filesToImport = driveFiles.filter((file) => selectedFiles.has(file.id));
    onFilesSelected(filesToImport);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">Select Google Drive Documents</h3>
      {loading && <p>Loading Google Drive files...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && driveFiles.length > 0 && (
        <div>
          <ul className="max-h-60 overflow-auto border rounded p-2 mb-4">
            {driveFiles.map((file) => (
              <li key={file.id} className="flex items-center gap-2 py-1">
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => toggleSelection(file.id)}
                />
                <span>{file.name}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-center">
            <button
              onClick={handleImport}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              disabled={selectedFiles.size === 0}
            >
              Import Selected Files
            </button>
          </div>
        </div>
      )}
      {!loading && driveFiles.length === 0 && !error && (
        <p>No files found in your Google Drive.</p>
      )}
    </div>
  );
};

export default GDrivePicker;