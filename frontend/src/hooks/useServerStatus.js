import { useState, useEffect } from 'react';
import axios from 'axios';

export function useServerStatus() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [frontendStatus, setFrontendStatus] = useState('online');
  const [lastChecked, setLastChecked] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://127.0.0.1:8000';

  useEffect(() => {
    // Check Backend
    const checkBackend = async () => {
      setBackendStatus('checking');
      setErrorMessage(null);
      try {
        const response = await axios.get(`${BACKEND_URL}/api/`, { timeout: 3000 });
        if (response && response.status === 200) {
          setBackendStatus('online');
        } else {
          setBackendStatus('offline');
          setErrorMessage(`Unexpected status ${response?.status}`);
        }
      } catch (error) {
        console.error('Backend health check failed:', error?.message ?? error);
        setBackendStatus('offline');
        setErrorMessage(error?.message ?? String(error));
      } finally {
        setLastChecked(new Date().toISOString());
      }
    };

    // Frontend is always online (it's the current page)
    setFrontendStatus('online');

    // Check backend on mount and every 5 seconds
    checkBackend();
    const interval = setInterval(checkBackend, 5000);

    return () => clearInterval(interval);
  }, [BACKEND_URL]);

  return {
    backendStatus,    // 'online', 'offline', 'checking'
    frontendStatus,   // always 'online' (or 'error' if added)
    lastChecked,
    errorMessage,
  };
}

export default useServerStatus;
