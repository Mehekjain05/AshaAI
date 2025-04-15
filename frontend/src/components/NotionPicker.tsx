import React, { useEffect, useRef } from 'react';

interface NotionPage {
  id: string;
  title: string;
}

interface NotionPickerProps {
  onPageSelected: (pages: NotionPage[]) => void;
  onClose: () => void;
}

const NotionPicker: React.FC<NotionPickerProps> = ({ onPageSelected, onClose }) => {
  const hasOpenedRef = useRef(false); // 👈 prevent multiple popups

  useEffect(() => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;

    const popup = window.open(
      `https://api.notion.com/v1/oauth/authorize?client_id=${import.meta.env.VITE_NOTION_CLIENT_ID}&response_type=code&owner=user&redirect_uri=${window.location.origin}/notion-auth`,
      '_blank',
      'width=600,height=700'
    );

    const interval = setInterval(async () => {
      if (!popup || popup.closed) {
        clearInterval(interval);
        onClose();
        return;
      }

      try {
        const params = new URLSearchParams(popup.location.search);
        const code = params.get('code');
        if (code) {
          popup.close();
          clearInterval(interval);

          const res = await fetch('http://localhost:5000/notion/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code }),
          });

          const { pages } = await res.json();
          onPageSelected(pages);
        }
      } catch (e) {
        // wait for cross-origin permission
      }
    }, 500);

    return () => clearInterval(interval);
  }, [onPageSelected, onClose]);

  return (
    <div className="p-4 text-center text-gray-600">
      Connecting to Notion...
    </div>
  );
};

export default NotionPicker;
