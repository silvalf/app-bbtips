import React, { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, useLocation } from "react-router-dom";
import { Sidebar, SidebarProvider, MobileHeader, useSidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";
import api from "@/lib/api";
import { createWebSocket } from "./lib/ws";
import { useServerStatus } from "./hooks/useServerStatus";
import RoboLogs from "@/components/RoboLogs";
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
  ChevronRight,
  Pencil,
  Trash2,
  Plus,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

// ============== SHARED COMPONENTS ==============

const StatusIndicator = ({ status, label, href }) => (
  <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
    <div className={cn(
      "w-3 h-3 rounded-full animate-pulse",
      status === 'online' ? "bg-emerald-500" : status === 'offline' ? "bg-red-500" : "bg-amber-500"
    )} />
    <div>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">
          {label}
        </a>
      ) : (
        <p className="text-sm font-medium text-slate-300">{label}</p>
      )}
      <p className={cn(
        "text-xs",
        status === 'online' ? "text-emerald-400" : status === 'offline' ? "text-red-400" : "text-amber-400"
      )}>
        {status === 'online' ? 'Online' : status === 'offline' ? 'Offline' : 'Verificando...'}
      </p>
    </div>
  </div>
);

// ============== PAGE COMPONENTS ==============

const Home = () => {
  const { backendStatus, frontendStatus, databaseStatus, lastChecked } = useServerStatus();
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
      try { ws?.close(); } catch (_e) { /* ignore */ }
    };
  }, []);

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
            <StatusIndicator status={backendStatus} label="Backend API" href="http://127.0.0.1:8000" />
            <StatusIndicator status={databaseStatus} label="SQL Server" href="http://127.0.0.1:8000/api/health" />
            <StatusIndicator status={frontendStatus} label="Frontend" href="/" />
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
              <a href="http://127.0.0.1:8000/docs" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">API Response (docs)</a>
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
  const [showModal, setShowModal] = React.useState(false);
  const [bancas, setBancas] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [formData, setFormData] = React.useState({
    nome: '',
    saldoInicial: '',
    stopLoss: '20',
    stopGain: '30',
    stakeBase: '10,00',
    stakePercent: '2'
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [deleteConfirm, setDeleteConfirm] = React.useState({ open: false, banca: null });
  const [editingBanca, setEditingBanca] = React.useState(null);

  // Buscar bancas ao carregar
  useEffect(() => {
    fetchBancas();
  }, []);

  const fetchBancas = async () => {
    try {
      const response = await api.get('/bancas');
      setBancas(response.data);
    } catch (error) {
      console.error('Erro ao buscar bancas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const payload = {
        Nome: formData.nome,
        SaldoInicial: parseFloat(formData.saldoInicial.replace(',', '.')),
        StopLoss: parseFloat(formData.stopLoss),
        StopGain: parseFloat(formData.stopGain),
        StakeBase: parseFloat(formData.stakeBase.replace(',', '.')),
        StakePercent: parseFloat(formData.stakePercent),
        Mercado: 1,
        Estrategia: 2,
        Multiplicador: 2,
        MaxGales: 3
      };
      
      if (editingBanca) {
        await api.put(`/bancas/${editingBanca.Id}`, payload);
        toast.success('Banca atualizada com sucesso!', {
          description: `${formData.nome} foi atualizada.`,
          duration: 4000,
        });
      } else {
        await api.post('/bancas', payload);
        toast.success('Banca criada com sucesso!', {
          description: `${formData.nome} foi adicionada às suas bancas.`,
          duration: 4000,
        });
      }
      
      setShowModal(false);
      setEditingBanca(null);
      setFormData({ nome: '', saldoInicial: '', stopLoss: '20', stopGain: '30', stakeBase: '10,00', stakePercent: '2' });
      fetchBancas();
    } catch (error) {
      console.error('Erro ao salvar banca:', error);
      toast.error('Erro ao salvar banca', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (banca) => {
    setEditingBanca(banca);
    setFormData({
      nome: banca.Nome || '',
      saldoInicial: banca.SaldoInicial ? String(banca.SaldoInicial).replace('.', ',') : '',
      stopLoss: banca.StopLoss ? String(banca.StopLoss) : '20',
      stopGain: banca.StopGain ? String(banca.StopGain) : '30',
      stakeBase: banca.StakeBase ? String(banca.StakeBase).replace('.', ',') : '10,00',
      stakePercent: banca.StakePercent ? String(banca.StakePercent) : '2'
    });
    setShowModal(true);
  };

  const handleDelete = async (bancaId) => {
    try {
      await api.delete(`/bancas/${bancaId}`);
      toast.success('Banca excluída com sucesso!', {
        description: 'A banca foi removida das suas configurações.',
        duration: 4000,
      });
      setDeleteConfirm({ open: false, banca: null });
      fetchBancas();
    } catch (error) {
      toast.error('Erro ao excluir banca', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
      console.error('Erro ao excluir banca:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const formatCurrency = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00';
    }
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value) => {
    if (value === undefined || value === null || isNaN(value)) {
      return '0%';
    }
    return `${value}%`;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Bancas</h1>
          <p className="text-slate-400">Gerencie suas bancas de apostas</p>
        </div>
        <Dialog open={showModal} onOpenChange={(open) => {
          setShowModal(open);
          if (!open) {
            setEditingBanca(null);
            setFormData({ nome: '', saldoInicial: '', stopLoss: '20', stopGain: '30', stakeBase: '10,00', stakePercent: '2' });
          }
        }}>
          <DialogTrigger asChild>
            <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors shadow-lg shadow-cyan-500/20 flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nova Banca
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px] bg-slate-900 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-white">{editingBanca ? 'Editar Banca' : 'Adicionar Banca'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="text-sm text-slate-300 block mb-2">Nome da Banca</label>
                <Input
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Nome da Banca"
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 block mb-2">Saldo Inicial</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                  <Input
                    name="saldoInicial"
                    type="text"
                    inputMode="decimal"
                    value={formData.saldoInicial}
                    onChange={handleChange}
                    placeholder="0,00"
                    className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-2">Stop Loss %</label>
                  <div className="relative">
                    <Input
                      name="stopLoss"
                      type="text"
                      inputMode="numeric"
                      value={formData.stopLoss}
                      onChange={handleChange}
                      className="pr-8 bg-slate-800 border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-2">Stop Gain %</label>
                  <div className="relative">
                    <Input
                      name="stopGain"
                      type="text"
                      inputMode="numeric"
                      value={formData.stopGain}
                      onChange={handleChange}
                      className="pr-8 bg-slate-800 border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 block mb-2">Stake Base</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">R$</span>
                    <Input
                      name="stakeBase"
                      type="text"
                      inputMode="decimal"
                      value={formData.stakeBase}
                      onChange={handleChange}
                      placeholder="10,00"
                      className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-300 block mb-2">% sobre Banca</label>
                  <div className="relative">
                    <Input
                      name="stakePercent"
                      type="text"
                      inputMode="numeric"
                      value={formData.stakePercent}
                      onChange={handleChange}
                      className="pr-8 bg-slate-800 border-slate-600 text-white focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">%</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Diálogo de confirmação de exclusão */}
      <Dialog open={deleteConfirm.open} onOpenChange={(open) => setDeleteConfirm({ open, banca: null })}>
        <DialogContent className="sm:max-w-[350px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-white">Excluir Banca</DialogTitle>
          </DialogHeader>
          <p className="text-slate-300 mt-4">
            Tem certeza que deseja excluir a banca <span className="font-semibold text-white">{deleteConfirm.banca?.nome}</span>?
            <br /><br />
            Esta ação não pode ser desfeita e todas as operações relacionadas serão perdidas.
          </p>
          <DialogFooter className="flex gap-3 pt-4">
            <button
              onClick={() => setDeleteConfirm({ open: false, banca: null })}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => deleteConfirm.banca && handleDelete(deleteConfirm.banca.id)}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
            >
              Excluir
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Grid de Bancas */}
      {loading ? (
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Carregando bancas...</p>
            </div>
          </CardContent>
        </Card>
      ) : bancas.length === 0 ? (
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
      ) : (
        <div className="grid gap-4">
          {bancas.map((banca) => (
            <Card key={banca.id} className="bg-slate-800/50 border-slate-700/50 hover:border-slate-600 transition-colors">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                      <Wallet className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{banca.Nome}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-slate-400">
                          Saldo: <span className="text-emerald-400 font-medium">{formatCurrency(banca.SaldoAtual)}</span>
                        </span>
                        <span className="text-sm text-slate-400">
                          Stop: <span className="text-red-400">{formatPercent(banca.StopLoss)}</span>
                        </span>
                        <span className="text-sm text-slate-400">
                          Gain: <span className="text-emerald-400">{formatPercent(banca.StopGain)}</span>
                        </span>
                        <span className="text-sm text-slate-400">
                          Stake: <span className="text-cyan-400">{formatCurrency(banca.StakeBase)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleEdit(banca)}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-cyan-400"
                      title="Editar"
                    >
                      <Pencil className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm({ open: true, banca: { id: banca.Id, nome: banca.Nome } })}
                      className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-red-400"
                      title="Excluir"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
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
        <p className="text-slate-400">Simule estratégias antes de aplicar ou execute o robô de automação</p>
      </div>

      {/* Componente de Logs do Robô */}
      <RoboLogs />

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
  const [bbtipsConfig, setBbtipsConfig] = React.useState(null);
  const [geralConfig, setGeralConfig] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [savingBbtips, setSavingBbtips] = React.useState(false);
  const [savingGeral, setSavingGeral] = React.useState(false);
  
  // Form states
  const [email, setEmail] = React.useState('');
  const [senha, setSenha] = React.useState('');
  const [urlBase, setUrlBase] = React.useState('https://app.bbtips.com.br');
  const [notificacoes, setNotificacoes] = React.useState(true);
  const [autoRefresh, setAutoRefresh] = React.useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const [bbtips, geral] = await Promise.all([
        api.get('/config/bbtips'),
        api.get('/config/geral')
      ]);
      
      if (bbtips.data && !bbtips.data.error) {
        setBbtipsConfig(bbtips.data);
        setEmail(bbtips.data.email || '');
        setSenha(bbtips.data.senha || '');
        setUrlBase(bbtips.data.urlbase || 'https://app.bbtips.com.br');
      }
      
      if (geral.data && !geral.data.error) {
        setGeralConfig(geral.data);
        setNotificacoes(geral.data.notificacoesativas ?? true);
        setAutoRefresh(geral.data.autologin ?? true);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      toast.error('Erro ao carregar configurações', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBbtips = async () => {
    setSavingBbtips(true);
    try {
      await api.put('/config/bbtips', {
        Email: email,
        Senha: senha,
        UrlBase: urlBase,
        LembrarCredenciais: false,
        AutoLogin: false,
        TimeoutSegundos: 30,
        ModoDebug: false
      });
      toast.success('Credenciais salvas!', {
        description: 'Suas credenciais do BB Tips foram atualizadas.',
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao salvar credenciais:', error);
      toast.error('Erro ao salvar credenciais', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setSavingBbtips(false);
    }
  };

  const handleSaveGeral = async () => {
    setSavingGeral(true);
    try {
      await api.put('/config/geral', {
        NotificacoesAtivas: notificacoes,
        SomAlerta: true,
        IntervaloAtualizacao: 5,
        TemaAplicacao: 'Dark',
        IniciarComWindows: false
      });
      toast.success('Preferências salvas!', {
        description: 'Suas preferências foram atualizadas.',
        duration: 4000,
      });
    } catch (error) {
      console.error('Erro ao salvar preferências:', error);
      toast.error('Erro ao salvar preferências', {
        description: 'Tente novamente mais tarde.',
        duration: 4000,
      });
    } finally {
      setSavingGeral(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-slate-400">Gerencie as configurações do aplicativo</p>
        </div>
        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400">Carregando configurações...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">Senha</label>
              <Input
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="••••••••"
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-sm text-slate-400 block mb-2">URL Base</label>
              <Input
                type="text"
                value={urlBase}
                onChange={(e) => setUrlBase(e.target.value)}
                placeholder="https://app.bbtips.com.br"
                className="bg-slate-900 border-slate-700 text-white placeholder-slate-500 focus:border-cyan-500"
              />
            </div>
            <button
              onClick={handleSaveBbtips}
              disabled={savingBbtips}
              className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingBbtips ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {savingBbtips ? 'Salvando...' : 'Salvar Credenciais'}
            </button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700/50">
          <CardHeader>
            <CardTitle className="text-white">Preferências</CardTitle>
            <CardDescription>Personalize sua experiência</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Notificações</span>
              <button
                onClick={() => setNotificacoes(!notificacoes)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  notificacoes ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                  notificacoes ? 'left-6' : 'left-0.5'
                }`}></div>
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Auto-refresh</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`w-12 h-6 rounded-full relative transition-colors ${
                  autoRefresh ? 'bg-cyan-500' : 'bg-slate-700'
                }`}
              >
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${
                  autoRefresh ? 'left-6' : 'left-0.5'
                }`}></div>
              </button>
            </div>
            <button
              onClick={handleSaveGeral}
              disabled={savingGeral}
              className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {savingGeral ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              {savingGeral ? 'Salvando...' : 'Salvar Preferências'}
            </button>
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
    <div className="flex min-h-screen bg-slate-950">
      <Sidebar />
      <MobileHeader />
      
      <main className={cn(
        "flex-1 transition-all duration-300 ease-in-out min-h-screen",
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
