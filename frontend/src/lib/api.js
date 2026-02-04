import axios from 'axios';

// Configuração centralizada do Axios
// Detecta automaticamente o ambiente (local vs preview/produção)

function getBackendUrl() {
  // Se há uma variável de ambiente definida, usa ela
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // Detecção automática baseada no hostname
  const hostname = window.location.hostname;
  
  // Se está rodando localmente (localhost ou 127.0.0.1)
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://127.0.0.1:8000';
  }
  
  // Para ambientes de preview/produção, usa o mesmo host com protocolo correto
  const protocol = window.location.protocol;
  return `${protocol}//${hostname}`;
}

const BACKEND_URL = getBackendUrl();

const api = axios.create({
  baseURL: `${BACKEND_URL}/api`,
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para logging de requisições
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

// Interceptor para logging e tratamento de respostas
api.interceptors.response.use(
  (response) => {
    console.log(`[API] Response ${response.status}`, response.data);
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`[API] Error ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error('[API] No response received:', error.request);
    } else {
      console.error('[API] Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
