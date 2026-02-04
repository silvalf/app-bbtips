import React, { useEffect } from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route, Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { createWebSocket } from "./lib/ws";
import { useServerStatus } from "./hooks/useServerStatus";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Home = () => {
  const { backendStatus, frontendStatus, lastChecked, errorMessage } = useServerStatus();
  const [apiMessage, setApiMessage] = React.useState(null);
  const [wsMessages, setWsMessages] = React.useState([]);

  useEffect(() => {
    const helloWorldApi = async () => {
      try {
        const response = await api.get('/');
        console.log('[Home] Backend message:', response.data.message);
        setApiMessage(response.data?.message ?? null);
      } catch (e) {
        console.error('[Home] Backend error:', e);
        setApiMessage(null);
      }
    };
    helloWorldApi();

    // WebSocket connection using helper.
    let ws;
    try {
      ws = createWebSocket('/ws');
      // store on window for quick manual testing in console
      window.__app_ws = ws;
      ws.addEventListener('message', (ev) => {
        try {
          const text = ev.data;
          console.log('[Home] WS message', text);
          setWsMessages((s) => [...s, text]);
        } catch (err) {
          console.error('WS message handling error', err);
        }
      });
    } catch (err) {
      console.error('Failed to create WebSocket', err);
    }

    return () => {
      try { ws?.close(); } catch (e) {}
    };
  }, []);

  const statusColor = (status) => {
    if (status === 'online') return '#10b981';
    if (status === 'offline') return '#ef4444';
    return '#f59e0b';
  };

  const statusText = (status) => {
    if (status === 'online') return '✓ Online';
    if (status === 'offline') return '✗ Offline';
    return '⟳ Checking';
  };

  return (
    <div>
      <h2>Home</h2>
      <p className="mt-5">Building something incredible ~!</p>
      
      <div style={{ marginTop: '30px', padding: '20px', borderRadius: '8px', backgroundColor: '#1f2937' }}>
        <h3 style={{ marginBottom: '15px', color: '#f3f4f6' }}>Server Status</h3>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ padding: '10px 15px', borderRadius: '6px', backgroundColor: '#374151', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: statusColor(backendStatus) }}></span>
              <span><strong>Backend:</strong> {statusText(backendStatus)}</span>
            </div>
            <small style={{ color:'#9ca3af', marginTop:6 }}>{lastChecked ? `Last checked: ${new Date(lastChecked).toLocaleTimeString()}` : ''} {errorMessage ? ` — ${errorMessage}` : ''}</small>
          </div>
          <div style={{ padding: '10px 15px', borderRadius: '6px', backgroundColor: '#374151', color: '#f3f4f6', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: statusColor(frontendStatus) }}></span>
            <span><strong>Frontend:</strong> {statusText(frontendStatus)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
        <h4 style={{ color:'#f3f4f6' }}>API Message</h4>
        <div style={{ color:'#e5e7eb' }}>{apiMessage ?? 'no message'}</div>

        <h4 style={{ color:'#f3f4f6', marginTop: 12 }}>WebSocket Messages</h4>
        <div style={{ maxHeight: 160, overflow: 'auto', background:'#111827', padding:8, borderRadius:6 }}>
          {wsMessages.length === 0 ? <div style={{ color:'#9ca3af' }}>no ws messages</div> : wsMessages.map((m, i) => <div key={i} style={{ color:'#d1fae5' }}>{m}</div>)}
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => { useEffect(()=>console.log('Dashboard mounted')); return <div><h2>Dashboard</h2></div>; };
const Bancas = () => { useEffect(()=>console.log('Bancas mounted')); return <div><h2>Bancas</h2></div>; };
const BancaDetalhe = () => { useEffect(()=>console.log('BancaDetalhe mounted')); return <div><h2>Banca Detalhe</h2></div>; };
const Configuracoes = () => { useEffect(()=>console.log('Configuracoes mounted')); return <div><h2>Configurações</h2></div>; };
const Padroes = () => { useEffect(()=>console.log('Padroes mounted')); return <div><h2>Padrões</h2></div>; };
const Simulador = () => { useEffect(()=>console.log('Simulador mounted')); return <div><h2>Simulador</h2></div>; };

function Layout() {
  const location = useLocation();
  useEffect(()=>{ console.log('Location changed:', location.pathname); }, [location]);

  return (
    <div className="App">
      <header className="App-header">
        <nav className="app-nav">
          <ul>
            <li><Link to="/">Home</Link></li>
            <li><Link to="/dashboard">Dashboard</Link></li>
            <li><Link to="/bancas">Bancas</Link></li>
            <li><Link to="/banca/1">Banca Detalhe</Link></li>
            <li><Link to="/padroes">Padrões</Link></li>
            <li><Link to="/simulador">Simulador</Link></li>
            <li><Link to="/configuracoes">Configurações</Link></li>
          </ul>
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="bancas" element={<Bancas />} />
          <Route path="banca/:id" element={<BancaDetalhe />} />
          <Route path="padroes" element={<Padroes />} />
          <Route path="simulador" element={<Simulador />} />
          <Route path="configuracoes" element={<Configuracoes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
