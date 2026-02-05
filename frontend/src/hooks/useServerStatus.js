import { useState, useEffect } from 'react';
import axios from 'axios';

// Funcao para detectar automaticamente a URL do backend
function getBackendUrl() {
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}`;
}

export function useServerStatus() {
  const [backendStatus, setBackendStatus] = useState('checking');
  const [frontendStatus, setFrontendStatus] = useState('online');
  const [databaseStatus, setDatabaseStatus] = useState('checking');
  const [lastChecked, setLastChecked] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const BACKEND_URL = getBackendUrl();

  useEffect(() => {
    // Check Backend and Database
    const checkBackend = async () => {
      setBackendStatus('checking');
      setDatabaseStatus('checking');
      setErrorMessage(null);
      
      try {
        const response = await axios.get(`${BACKEND_URL}/api/health`, { timeout: 5000 });
        console.log('Health check response:', response.data);
        if (response && response.status === 200) {
          // Verificar status do backend
          if (response.data.backend === 'online' || response.data.status === 'online') {
            setBackendStatus('online');
          } else if (response.data.status === 'degraded') {
            setBackendStatus('degraded');
          } else {
            setBackendStatus('offline');
          }
          // Verificar status do banco de dados
          if (response.data.sql_connected === true) {
            setDatabaseStatus('online');
          } else if (response.data.sql_connected === false) {
            setDatabaseStatus('offline');
          } else {
            setDatabaseStatus('unknown');
          }
          // Exibir erro do SQL se houver
          if (response.data.sql_error) {
            setErrorMessage(response.data.sql_error);
          }
        } else {
          setBackendStatus('offline');
          setDatabaseStatus('unknown');
          setErrorMessage(`Unexpected status ${response?.status}`);
        }
      } catch (error) {
        console.error('Backend health check failed:', error?.message ?? error);
        setBackendStatus('offline');
        setDatabaseStatus('unknown');
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
    databaseStatus,   // 'online', 'offline', 'checking', 'unknown'
    lastChecked,
    errorMessage,
  };
}

export default useServerStatus;
