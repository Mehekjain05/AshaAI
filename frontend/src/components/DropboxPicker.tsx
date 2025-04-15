import React, { useEffect, useState } from 'react';
import { Dropbox, DropboxAuth } from 'dropbox';

interface DropboxFile {
  id: string;
  name: string;
  path_lower: string;
}

interface DropboxPickerProps {
  onFilesSelected: (files: DropboxFile[]) => void;
  onClose: () => void;
}

const DropboxPicker: React.FC<DropboxPickerProps> = ({ onFilesSelected, onClose }) => {
  const CLIENT_ID = import.meta.env.VITE_DROPBOX_KEY;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dropboxFiles, setDropboxFiles] = useState<DropboxFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const auth = new DropboxAuth({ clientId: CLIENT_ID });

    auth.getAuthenticationUrl(`${window.location.origin}/auth`, undefined, 'token', 'online', ['files.metadata.read'], 'user', true)
      .then(authUrl => {
        const popup = window.open(authUrl, '_blank', 'width=600,height=700');

        const interval = setInterval(() => {
          try {
            if (!popup || popup.closed) {
              clearInterval(interval);
              onClose();
              return;
            }


            const accessToken = import.meta.env.VITE_DROPBOX_CLIENTID;
            if (accessToken) {
              popup.close();
              clearInterval(interval);
              fetchDropboxFiles(accessToken);
            }
          } catch (e) {
            // Ignore cross-origin errors until redirect
          }
        }, 500);
      });
  }, [CLIENT_ID, onClose]);

  const fetchDropboxFiles = async (token: string) => {
    setLoading(true);
    const dbx = new Dropbox({ accessToken: token });
    try {
      const response = await dbx.filesListFolder({ path: '' });
      const files = response.result.entries
        .filter((entry): entry is DropboxFile => entry['.tag'] === 'file')
        .map(file => ({
          id: file.id,
          name: file.name,
          path_lower: file.path_lower,
        }));
      setDropboxFiles(files);
    } catch (err) {
      console.error('Error fetching Dropbox files:', err);
      setError('Failed to fetch Dropbox files.');
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (fileId: string) => {
    setSelectedFiles(prev => {
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
    const selected = dropboxFiles.filter(file => selectedFiles.has(file.id));
    onFilesSelected(selected);
  };

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold mb-4 text-center">Select Dropbox Files</h3>
      {loading && <p>Loading Dropbox files...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {!loading && dropboxFiles.length > 0 && (
        <>
          <ul className="max-h-60 overflow-auto border rounded p-2 mb-4">
            {dropboxFiles.map((file) => (
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
        </>
      )}
      {!loading && dropboxFiles.length === 0 && !error && (
        <p>No files found in your Dropbox.</p>
      )}
    </div>
  );
};

export default DropboxPicker;
