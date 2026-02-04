import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Sidebar, SidebarProvider, MobileHeader, useSidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { createWebSocket } from "./lib/ws";
import { useServerStatus } from "./hooks/useServerStatus";
import { 
  Activity, 
  Server, 
  Wifi, 
  MessageSquare,
  TrendingUp,
  Wallet,
  FileText,
  Calculator,
  Settings,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// ============== PAGE COMPONENTS ==============

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

    let ws;
    try {
      ws = createWebSocket('/ws');
      window.__app_ws = ws;
      ws.addEventListener('message', (ev) => {
        try {
          const text = ev.data;
          console.log('[Home] WS message', text);
          setWsMessages((s) => [...s.slice(-9), text]);
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

  const StatusIndicator = ({ status, label }) => (
    <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
      <div className={cn(
        "w-3 h-3 rounded-full animate-pulse",
        status === 'online' ? "bg-emerald-500" : status === 'offline' ? "bg-red-500" : "bg-amber-500"
      )} />
      <div>
        <p className="text-sm font-medium text-slate-300">{label}</p>
        <p className={cn(
          "text-xs",
          status === 'online' ? "text-emerald-400" : status === 'offline' ? "text-red-400" : "text-amber-400"
        )}>
          {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Verificando...'}
        </p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700/50">
        <h1 className="text-2xl font-bold text-white mb-2">Bem-vindo ao BB Tips Manager</h1>
        <p className="text-slate-400">Sistema de gerenciamento de bancas e padrões para apostas esportivas.</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Server className="w-4 h-4" />
              Status dos Servidores
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <StatusIndicator status={backendStatus} label="Backend API" />
            <StatusIndicator status={frontendStatus} label="Frontend" />
            {lastChecked && (
              <p className="text-xs text-slate-500 text-center">
                Última verificação: {new Date(lastChecked).toLocaleTimeString()}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Activity className="w-4 h-4" />
              API Response
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
              {apiMessage ? (
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                    200 OK
                  </Badge>
                  <span className="text-slate-300">{apiMessage}</span>
                </div>
              ) : (
                <span className="text-slate-500">Aguardando resposta...</span>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
              <Wifi className="w-4 h-4" />
              WebSocket
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/30 max-h-32 overflow-y-auto">
              {wsMessages.length === 0 ? (
                <span className="text-slate-500 text-sm">Aguardando mensagens...</span>
              ) : (
                <div className="space-y-1">
                  {wsMessages.slice(-5).map((m, i) => (
                    <div key={i} className="text-xs text-cyan-400 font-mono truncate">{m}</div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-lg text-white">Acesso Rápido</CardTitle>
          <CardDescription>Navegue rapidamente para as principais funcionalidades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: TrendingUp, label: 'Dashboard', href: '/dashboard', color: 'from-blue-500 to-cyan-500' },
              { icon: Wallet, label: 'Bancas', href: '/bancas', color: 'from-emerald-500 to-green-500' },
              { icon: FileText, label: 'Padrões', href: '/padroes', color: 'from-purple-500 to-pink-500' },
              { icon: Calculator, label: 'Simulador', href: '/simulador', color: 'from-amber-500 to-orange-500' },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-2 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30 hover:border-slate-600 transition-all group"
              >
                <div className={cn("w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center", item.color)}>
                  <item.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-slate-300 group-hover:text-white transition-colors">{item.label}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Dashboard = () => {
  useEffect(() => console.log('Dashboard mounted'), []);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400">Visão geral de todas as bancas</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Saldo Total', value: 'R$ 0,00', change: '+0%', color: 'text-emerald-400' },
          { label: 'Lucro Mensal', value: 'R$ 0,00', change: '+0%', color: 'text-emerald-400' },
          { label: 'Assertividade', value: '0%', change: '0%', color: 'text-slate-400' },
          { label: 'Bancas Ativas', value: '0', change: '', color: 'text-cyan-400' },
        ].map((stat, i) => (
          <Card key={i} className="bg-slate-800/50 border-slate-700/50">
            <CardContent className="p-6">
              <p className="text-sm text-slate-400">{stat.label}</p>
              <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              {stat.change && <p className={cn("text-xs mt-1", stat.color)}>{stat.change}</p>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white">Histórico de Operações</CardTitle>
          <CardDescription>Nenhuma operação registrada ainda</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-slate-500">
            <p>Configure suas bancas para começar a registrar operações</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Bancas = () => {
  useEffect(() => console.log('Bancas mounted'), []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bancas</h1>
          <p className="text-slate-400">Gerencie suas bancas de apostas</p>
        </div>
        <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
          + Nova Banca
        </button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <Wallet className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhuma banca cadastrada</h3>
            <p className="text-slate-400 max-w-sm">
              Crie sua primeira banca para começar a gerenciar suas apostas com controle de risco.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const BancaDetalhe = () => {
  useEffect(() => console.log('BancaDetalhe mounted'), []);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Detalhes da Banca</h1>
        <p className="text-slate-400">Visualize e gerencie sua banca</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Operações</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-400">Nenhuma operação registrada</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Stop Loss</span>
              <span className="text-white">20%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Stop Gain</span>
              <span className="text-white">30%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estratégia</span>
              <Badge variant="outline" className="text-cyan-400 border-cyan-400/30">Moderada</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Padroes = () => {
  useEffect(() => console.log('Padroes mounted'), []);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Padrões</h1>
          <p className="text-slate-400">Cadastre padrões do BB Tips</p>
        </div>
        <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
          + Novo Padrão
        </button>
      </div>

      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardContent className="p-12">
          <div className="flex flex-col items-center justify-center text-center">
            <FileText className="w-12 h-12 text-slate-600 mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">Nenhum padrão cadastrado</h3>
            <p className="text-slate-400 max-w-sm">
              Cadastre padrões para organizar suas estratégias de apostas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const Simulador = () => {
  useEffect(() => console.log('Simulador mounted'), []);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Simulador</h1>
        <p className="text-slate-400">Simule estratégias antes de aplicar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Configuração</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Saldo Inicial</label>
              <input 
                type="number" 
                placeholder="R$ 1000,00"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Estratégia</label>
              <select className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500">
                <option>Conservadora</option>
                <option>Moderada</option>
                <option>Alavancagem</option>
              </select>
            </div>
            <button className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
              Simular
            </button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 text-slate-500">
              <p>Configure e execute uma simulação</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

const Configuracoes = () => {
  useEffect(() => console.log('Configuracoes mounted'), []);
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
        <p className="text-slate-400">Gerencie as configurações do aplicativo</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Credenciais BB Tips</CardTitle>
            <CardDescription>Configure suas credenciais de acesso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-slate-400 block mb-2">Email</label>
              <input 
                type="email" 
                placeholder="seu@email.com"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Senha</label>
              <input 
                type="password" 
                placeholder="••••••••"
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors">
              Salvar Credenciais
            </button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Preferências</CardTitle>
            <CardDescription>Personalize sua experiência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Notificações</span>
              <div className="w-12 h-6 bg-slate-700 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-slate-400 rounded-full absolute top-0.5 left-0.5"></div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Auto-refresh</span>
              <div className="w-12 h-6 bg-cyan-500 rounded-full relative cursor-pointer">
                <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// ============== LAYOUT COMPONENT ==============

function MainLayout() {
  const location = useLocation();
  const { isCollapsed } = useSidebar();

  useEffect(() => {
    console.log('Location changed:', location.pathname);
  }, [location]);

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar />
      <MobileHeader />
      
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        "pt-14 lg:pt-0", // Mobile header offset
        isCollapsed ? "lg:ml-[70px]" : "lg:ml-[260px]"
      )}>
        <div className="p-4 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// ============== APP COMPONENT ==============

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Home />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="bancas" element={<Bancas />} />
            <Route path="banca/:id" element={<BancaDetalhe />} />
            <Route path="padroes" element={<Padroes />} />
            <Route path="simulador" element={<Simulador />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Route>
        </Routes>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default App;
