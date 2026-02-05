import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import api from '@/lib/api';
import { Play, Square, RefreshCw, Trash2, Download } from 'lucide-react';

const RoboLogs = () => {
  const [logs, setLogs] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [credenciais, setCredenciais] = useState([]);
  const [selectedCredencial, setSelectedCredencial] = useState('');
  const logsEndRef = useRef(null);
  const wsRef = useRef(null);

  // Cores para níveis de log
  const getLogColor = (level) => {
    switch (level) {
      case 'SUCCESS':
        return 'text-green-400 bg-green-400/10 border-green-400/20';
      case 'ERROR':
        return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'INFO':
        return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'DEBUG':
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
      default:
        return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  // Ícones para níveis de log
  const getLogIcon = (level) => {
    switch (level) {
      case 'SUCCESS': return '✓';
      case 'ERROR': return '✕';
      case 'WARNING': return '⚠';
      case 'INFO': return 'ℹ';
      case 'DEBUG': return '⚙';
      default: return '•';
    }
  };

  // Carregar credenciais
  useEffect(() => {
    const fetchCredenciais = async () => {
      try {
        const response = await api.get('/credenciais');
        setCredenciais(response.data || []);
        if (response.data?.length > 0) {
          setSelectedCredencial(response.data[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar credenciais:', error);
      }
    };
    fetchCredenciais();
  }, []);

  // Carregar status do robô
  const fetchStatus = useCallback(async () => {
    try {
      const response = await api.get('/robo/status');
      setStatus(response.data);
      if (response.data?.logs) {
        setLogs(prev => {
          const newLogs = [...prev];
          response.data.logs.forEach(log => {
            if (!prev.find(l => l.timestamp === log.timestamp && l.message === log.message)) {
              newLogs.push(log);
            }
          });
          return newLogs.slice(-500);
        });
      }
      setIsRunning(response.data?.status === 'running');
    } catch (error) {
      console.error('Erro ao carregar status:', error);
    }
  }, []);

  // Conectar WebSocket para logs em tempo real
  useEffect(() => {
    const connectWebSocket = () => {
      const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.hostname}:8000/ws`;
      
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        return;
      }

      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('[WS] Conectado ao servidor de logs');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'log') {
            setLogs(prev => [...prev.slice(-500), data.data]);
          }
        } catch (e) {
          console.error('[WS] Erro ao processar mensagem:', e);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[WS] Erro:', error);
      };
      
      ws.onclose = () => {
        console.log('[WS] Desconectado, tentando reconectar em 5s...');
        setTimeout(connectWebSocket, 5000);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Auto-scroll para novos logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  // Iniciar robô
  const handleStart = async () => {
    if (!selectedCredencial) {
      alert('Selecione uma credencial primeiro');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/robo/iniciar', {
        CredencialId: selectedCredencial,
        IntervaloVerificacao: 30,
        ModoDebug: false
      });
      setStatus(response.data);
      setIsRunning(true);
    } catch (error) {
      console.error('Erro ao iniciar robô:', error);
      alert('Erro ao iniciar robô: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Parar robô
  const handleStop = async () => {
    setLoading(true);
    try {
      const response = await api.post('/robo/parar');
      setStatus(response.data);
      setIsRunning(false);
    } catch (error) {
      console.error('Erro ao parar robô:', error);
    } finally {
      setLoading(false);
    }
  };

  // Limpar logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Exportar logs
  const handleExportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `robo-logs-${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <Card className="bg-slate-800/50 border-slate-700/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              🤖 Robo BB Tips - Logs em Tempo Real
            </CardTitle>
            <p className="text-slate-400 text-sm mt-1">
              {isRunning ? (
                <Badge variant="default" className="bg-green-500/20 text-green-400 border-green-500/50">
                  ● Robô em execução
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-slate-500/20 text-slate-400 border-slate-500/50">
                  ○ Robô parado
                </Badge>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={selectedCredencial}
              onChange={(e) => setSelectedCredencial(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-sm"
              disabled={isRunning}
            >
              <option value="">Selecione uma credencial</option>
              {credenciais.map((cred) => (
                <option key={cred.id} value={cred.id}>
                  {cred.nome} ({cred.email})
                </option>
              ))}
            </select>
            
            <Button
              onClick={handleStart}
              disabled={isRunning || loading || !selectedCredencial}
              className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50"
            >
              <Play className="w-4 h-4 mr-2" />
              Iniciar
            </Button>
            
            <Button
              onClick={handleStop}
              disabled={!isRunning || loading}
              className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border-red-500/50"
            >
              <Square className="w-4 h-4 mr-2" />
              Parar
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Stats do robô */}
          {status?.config && (
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-slate-400 text-xs">Email</p>
                <p className="text-white font-medium truncate">{status.config.email}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-slate-400 text-xs">Intervalo</p>
                <p className="text-white font-medium">{status.config.intervalo}s</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-slate-400 text-xs">Logs</p>
                <p className="text-white font-medium">{logs.length}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <p className="text-slate-400 text-xs">Status</p>
                <p className="text-white font-medium capitalize">{status.status}</p>
              </div>
            </div>
          )}
          
          {/* Área de logs */}
          <div className="bg-slate-950 rounded-lg border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-900/50 border-b border-slate-700/50">
              <span className="text-slate-400 text-sm font-medium">Logs</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearLogs}
                  className="text-slate-400 hover:text-white"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleExportLogs}
                  className="text-slate-400 hover:text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Exportar
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-96">
              <div className="p-4 space-y-2">
                {logs.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-500">Nenhum log ainda</p>
                    <p className="text-slate-600 text-sm">Inicie o robô para ver os logs em tempo real</p>
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={`${log.timestamp}-${index}`}
                      className={`flex items-start gap-3 p-2 rounded-lg border ${getLogColor(log.level)}`}
                    >
                      <span className="text-lg">{getLogIcon(log.level)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs opacity-70">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {log.level}
                          </Badge>
                        </div>
                        <p className="text-sm break-all">{log.message}</p>
                        {log.details && (
                          <p className="text-xs opacity-60 mt-1 font-mono">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
                <div ref={logsEndRef} />
              </div>
            </ScrollArea>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoboLogs;
