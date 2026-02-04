// Utility to create a WebSocket using the correct protocol and port
// Usage: const ws = createWebSocket('/ws')

export function createWebSocket(path = '/ws', opts = {}) {
  // Options
  const {
    reconnect = true,
    maxRetries = 6,
    retryBaseDelay = 1000, // ms
    autoReload = false,
    forceSecure = false,
  } = opts;

  // Determine websocket URL
  const explicitWs = process.env.REACT_APP_BACKEND_WS_URL;
  const backend = process.env.REACT_APP_BACKEND_URL;

  let wsUrl;
  if (explicitWs) {
    wsUrl = explicitWs.endsWith(path) ? explicitWs : `${explicitWs.replace(/\/$/, '')}${path}`;
  } else if (backend) {
    try {
      const u = new URL(backend);
      const proto = (u.protocol === 'https:' || forceSecure) ? 'wss:' : 'ws:';
      wsUrl = `${proto}//${u.host}${path}`;
    } catch (e) {
      const proto = (window.location.protocol === 'https:' || forceSecure) ? 'wss:' : 'ws:';
      // backend might be host:port
      const host = backend.replace(/\/$/, '');
      wsUrl = `${proto}//${host}${path}`;
    }
  } else {
    const proto = (window.location.protocol === 'https:' || forceSecure) ? 'wss:' : 'ws:';
    const defaultPort = proto === 'wss:' ? '443' : '8000';
    const host = window.location.hostname || 'localhost';
    wsUrl = `${proto}//${host}:${defaultPort}${path}`;
  }

  // Event listeners cache so they survive reconnects
  const listeners = { open: [], message: [], error: [], close: [] };

  let socket = null;
  let attempts = 0;
  let closedByUser = false;

  function attachSocket(s) {
    s.addEventListener('open', (ev) => {
      attempts = 0;
      console.log('[WS] open', wsUrl);
      listeners.open.forEach((fn) => { try { fn(ev); } catch (e) { console.error(e); } });
    });
    s.addEventListener('message', (ev) => {
      try { listeners.message.forEach((fn) => fn(ev)); } catch (e) { console.error(e); }
    });
    s.addEventListener('error', (ev) => {
      console.error('[WS] error', ev);
      listeners.error.forEach((fn) => { try { fn(ev); } catch (e) { console.error(e); } });
    });
    s.addEventListener('close', (ev) => {
      console.warn('[WS] close', ev.code, ev.reason);
      listeners.close.forEach((fn) => { try { fn(ev); } catch (e) { console.error(e); } });
      if (!closedByUser && reconnect && attempts < maxRetries) {
        const delay = retryBaseDelay * Math.pow(2, attempts);
        console.log(`[WS] reconnecting in ${delay}ms (attempt ${attempts + 1}/${maxRetries})`);
        attempts += 1;
        setTimeout(() => { tryConnect(); }, delay);
      } else if (!closedByUser && autoReload) {
        console.warn('[WS] not reconnecting — scheduling page reload in 5s');
        setTimeout(() => window.location.reload(), 5000);
      }
    });
  }

  function tryConnect() {
    try {
      socket = new WebSocket(wsUrl);
      attachSocket(socket);
    } catch (err) {
      console.error('[WS] connection failed', err);
      if (reconnect && attempts < maxRetries) {
        const delay = retryBaseDelay * Math.pow(2, attempts);
        attempts += 1;
        setTimeout(tryConnect, delay);
      }
    }
  }

  // start initial connection
  console.log('[WS] resolved url ->', wsUrl);
  tryConnect();

  // Public wrapper exposing a subset of WebSocket API
  const wrapper = {
    addEventListener: (type, fn) => {
      if (!listeners[type]) listeners[type] = [];
      listeners[type].push(fn);
      return () => { listeners[type] = listeners[type].filter((f) => f !== fn); };
    },
    removeEventListener: (type, fn) => {
      if (!listeners[type]) return;
      listeners[type] = listeners[type].filter((f) => f !== fn);
    },
    send: (data) => {
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(data);
        return true;
      }
      console.warn('[WS] send failed — socket not open');
      return false;
    },
    close: (code, reason) => {
      closedByUser = true;
      try { socket?.close(code, reason); } catch (e) { console.error(e); }
    },
    raw: () => socket,
    url: () => wsUrl,
  };

  // Attach console logging listeners by default for debugging
  wrapper.addEventListener('open', () => console.log('[WS.wrapper] connected'));
  wrapper.addEventListener('close', (ev) => console.log('[WS.wrapper] closed', ev && ev.code));

  return wrapper;
}
