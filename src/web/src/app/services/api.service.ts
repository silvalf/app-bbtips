import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Bot {
  id: number;
  name: string;
  platform: string;
  game: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Log {
  id: number;
  level: string;
  message: string;
  details?: string;
  timestamp: Date;
}

export interface Credencial {
  id: string;
  email: string;
  nome?: string;
  ativo?: boolean;
}

export interface OddMedia {
  id: number;
  nome_campeonato: string;
  time_mandante: string;
  time_visitante: string;
  data_evento: string;
  odd_vitoria_mandante: number;
  odd_empate: number;
  odd_vitoria_visitante: number;
  odd_over_25: number;
  odd_under_25: number;
  odd_ambos_marcam_sim: number;
  odd_ambos_marcam_nao: number;
}

export interface RobotLogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  step?: number;
}

export interface RobotStatus {
  isRunning: boolean;
  processId?: string;
  logsCount: number;
  lastCacheUpdate?: string;
  cacheExpired: boolean;
}

export interface RobotCardData {
  indice: number;
  titulo: string;
  padroes: string;
  percentual: string;
  estatisticas: {
    SG: number;
    G1: number;
    G2: number;
  };
}

export interface RobotCardsResponse {
  dadosCards: RobotCardData[];
  count: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  // Bots
  getBots(): Observable<Bot[]> {
    return this.http.get<Bot[]>(`${this.apiUrl}/bots`);
  }

  getBot(id: number): Observable<Bot> {
    return this.http.get<Bot>(`${this.apiUrl}/bots/${id}`);
  }

  createBot(bot: Partial<Bot>): Observable<Bot> {
    return this.http.post<Bot>(`${this.apiUrl}/bots`, bot);
  }

  updateBot(id: number, bot: Partial<Bot>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/bots/${id}`, bot);
  }

  deleteBot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bots/${id}`);
  }

  // Logs
  getLogs(): Observable<Log[]> {
    return this.http.get<Log[]>(`${this.apiUrl}/logs`);
  }

  // Credenciais
  getCredenciais(): Observable<Credencial[]> {
    return this.http.get<Credencial[]>(`${this.apiUrl}/credenciaisbots`);
  }

  // Odds
  getOddsMedias(): Observable<OddMedia[]> {
    return this.http.get<OddMedia[]>(`${this.apiUrl}/odds/medias`);
  }

  // Robot
  getRobotStatus(): Observable<RobotStatus> {
    return this.http.get<RobotStatus>(`${this.apiUrl}/robot/status`);
  }

  getRobotLogs(lastId?: number): Observable<{ logs: RobotLogEntry[], lastLogId: number }> {
    const url = lastId 
      ? `${this.apiUrl}/robot/logs?lastId=${lastId}` 
      : `${this.apiUrl}/robot/logs`;
    return this.http.get<{ logs: RobotLogEntry[], lastLogId: number }>(url);
  }

  startRobot(credencialId: string, tipo: string): Observable<{ success: boolean; processId?: string }> {
    return this.http.post<{ success: boolean; processId?: string }>(`${this.apiUrl}/robot/start`, {
      credencialId,
      tipo
    });
  }

  stopRobot(): Observable<{ success: boolean; cached: boolean }> {
    return this.http.post<{ success: boolean; cached: boolean }>(`${this.apiUrl}/robot/stop`, {});
  }

  getRobotCache(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/robot/cache`);
  }

  getRobotCards(): Observable<RobotCardsResponse> {
    return this.http.get<RobotCardsResponse>(`${this.apiUrl}/robot/cards`);
  }

  clearRobotCache(): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/robot/cache`);
  }

  // Simulação
  simularPlacar(request: {
    placarMandante: number;
    placarVisitante: number;
    oddVitoriaMandante: number;
    oddEmpate: number;
    oddVitoriaVisitante: number;
    stake: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/odds/simular`, request);
  }
}
