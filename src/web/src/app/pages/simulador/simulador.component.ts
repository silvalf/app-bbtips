import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService } from '../../services/api.service';

interface Credencial {
  id: string;
  email: string;
  nome?: string;
  ativo?: boolean;
}

interface OddMedia {
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

interface LogEntry {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  data?: any;
  step?: number;
}

interface Simulacao {
  placar: string;
  recomendacao: string;
  oddSugerida: number;
  probabilidadesImplicitas: {
    mandante: number;
    empate: number;
    visitante: number;
  };
  comparacao: {
    oddMercado: number;
    stake: number;
    potencialLucro: number;
  };
}

interface RobotCardData {
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

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="simulador-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Simulador</h1>
          <p class="page-subtitle">Teste suas estrategias e simule placares</p>
        </div>
        <div class="status-badge" [class.running]="robotStatus.isRunning">
          <span class="status-dot"></span>
          {{ robotStatus.isRunning ? ' Robo em Execucao' : ' Robo Parado' }}
        </div>
      </div>

      <!-- Selecao de Credencial -->
      <div class="card">
        <h2 class="card-title">Configuracao do Robo</h2>
        <div class="form-row">
          <div class="form-group">
            <label>Selecionar Credencial</label>
            <select [(ngModel)]="selectedCredencialId" class="form-select" [disabled]="robotStatus.isRunning">
              <option value="">Selecione uma credencial...</option>
              <option *ngFor="let cred of credenciais" [value]="cred.id">
                {{ cred.email }} {{ cred.nome ? '- ' + cred.nome : '' }}
              </option>
            </select>
          </div>
          <div class="button-group">
            <button 
              class="btn btn-primary" 
              (click)="startRobot()" 
              [disabled]="robotStatus.isRunning || !selectedCredencialId">
              <span class="btn-icon">INICIAR</span> 
            </button>
            <button 
              class="btn btn-danger" 
              (click)="stopRobot()" 
              [disabled]="!robotStatus.isRunning">
              <span class="btn-icon">PARAR</span> 
            </button>
          </div>
        </div>

        <!-- Cache Info -->
        <div class="cache-info" *ngIf="cacheInfo">
          <div class="cache-badge">
            <span class="cache-icon">Cache:</span>
            {{ cacheInfo }}
          </div>
          <button class="btn btn-sm btn-secondary" (click)="clearCache()">Limpar Cache</button>
        </div>
      </div>

      <!-- Logs em Tempo Real (WebSocket) -->
      <div class="card logs-card">
        <div class="card-header">
          <h2 class="card-title">Logs do Robo (Tempo Real)</h2>
          <div class="logs-controls">
            <span class="connection-status" [class.connected]="socketConnected">
              {{ socketConnected ? 'Conectado' : 'Desconectado' }}
            </span>
            <span class="logs-count">{{ logs.length }} eventos</span>
            <button class="btn btn-sm btn-secondary" (click)="clearLogs()">Limpar</button>
          </div>
        </div>
        <div class="logs-container" #logsContainer>
          <div 
            *ngFor="let log of logs" 
            class="log-entry" 
            [class]="'log-' + log.level.toLowerCase()">
            <span class="log-timestamp">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">[{{ log.level }}]</span>
            <span class="log-message">{{ log.message }}</span>
            <span class="log-step" *ngIf="log.step">#{{ log.step }}</span>
          </div>
          <div *ngIf="logs.length === 0" class="empty-logs">
            Nenhum log ainda. Inicie o robo para ver os eventos em tempo real.
          </div>
        </div>
      </div>

      <!-- Cards Extraídos pelo Robô -->
      <div class="card" *ngIf="robotCards.length > 0">
        <div class="card-header">
          <h2 class="card-title">Cards do Robô</h2>
          <button class="btn btn-sm btn-secondary" (click)="loadRobotCards()">Atualizar</button>
        </div>
        
        <!-- Tabela de Resultados -->
        <div class="cards-table-container">
          <table class="cards-table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Padrões</th>
                <th>Percentual</th>
                <th>SG</th>
                <th>G1</th>
                <th>G2</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let card of robotCards">
                <td class="td-titulo">{{ card.titulo }}</td>
                <td class="td-padroes">{{ card.padroes }}</td>
                <td class="td-percentual">{{ card.percentual }}</td>
                <td class="td-sg">{{ card.estatisticas?.SG }}</td>
                <td class="td-g1">{{ card.estatisticas?.G1 }}</td>
                <td class="td-g2">{{ card.estatisticas?.G2 }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Odds e Simulacao -->
      <div class="two-columns">
        <!-- Odds Medias -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Odds Medias - Copa do Mundo</h2>
            <button class="btn btn-sm btn-secondary" (click)="loadOdds()">Atualizar</button>
          </div>
          <div class="odds-table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Campeonato</th>
                  <th>Mandante</th>
                  <th>Visitante</th>
                  <th>1</th>
                  <th>X</th>
                  <th>2</th>
                  <th>+2.5</th>
                  <th>Acao</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let odd of odds; let i = index" [class.selected]="selectedOddIndex === i">
                  <td class="text-truncate">{{ odd.nome_campeonato }}</td>
                  <td>{{ odd.time_mandante }}</td>
                  <td>{{ odd.time_visitante }}</td>
                  <td class="odd-value">{{ odd.odd_vitoria_mandante | number:'1.2-2' }}</td>
                  <td class="odd-value">{{ odd.odd_empate | number:'1.2-2' }}</td>
                  <td class="odd-value">{{ odd.odd_vitoria_visitante | number:'1.2-2' }}</td>
                  <td class="odd-value">{{ odd.odd_over_25 | number:'1.2-2' }}</td>
                  <td>
                    <button class="btn btn-sm btn-primary" (click)="selectOdd(i)">Selecionar</button>
                  </td>
                </tr>
              </tbody>
            </table>
            <div *ngIf="odds.length === 0" class="empty-odds">
              Carregando odds... ou clique em atualizar.
            </div>
          </div>
        </div>

        <!-- Simulacao de Placar -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Simulacao de Placar</h2>
          </div>
          <div class="simulacao-container" *ngIf="selectedOdd">
            <div class="match-info">
              <span class="match-teams">{{ selectedOdd.time_mandante }} vs {{ selectedOdd.time_visitante }}</span>
              <span class="match-date">{{ selectedOdd.data_evento | date:'dd/MM/yyyy HH:mm' }}</span>
            </div>
            
            <div class="score-inputs">
              <div class="score-input-group">
                <label>Mandante</label>
                <input 
                  type="number" 
                  [(ngModel)]="placarMandante" 
                  min="0" 
                  max="10" 
                  class="score-input">
              </div>
              <span class="score-separator">x</span>
              <div class="score-input-group">
                <label>Visitante</label>
                <input 
                  type="number" 
                  [(ngModel)]="placarVisitante" 
                  min="0" 
                  max="10" 
                  class="score-input">
              </div>
            </div>

            <div class="stake-input">
              <label>Stake (R$)</label>
              <input type="number" [(ngModel)]="stake" min="1" class="form-input">
            </div>

            <button class="btn btn-primary btn-block" (click)="simular()">
              Calcular Simulacao
            </button>

            <!-- Resultado da Simulacao -->
            <div class="simulacao-result" *ngIf="simulacaoResult">
              <div class="result-header">
                <span class="result-placar">{{ simulacaoResult.placar }}</span>
                <span class="result-recomendacao" [class]="'rec-' + simulacaoResult.recomendacao.toLowerCase().replace(' ', '-')">
                  {{ simulacaoResult.recomendacao }}
                </span>
              </div>
              
              <div class="probabilidades">
                <div class="prob-item">
                  <span class="prob-label">Mandante</span>
                  <span class="prob-value">{{ simulacaoResult.probabilidadesImplicitas.mandante }}%</span>
                </div>
                <div class="prob-item">
                  <span class="prob-label">Empate</span>
                  <span class="prob-value">{{ simulacaoResult.probabilidadesImplicitas.empate }}%</span>
                </div>
                <div class="prob-item">
                  <span class="prob-label">Visitante</span>
                  <span class="prob-value">{{ simulacaoResult.probabilidadesImplicitas.visitante }}%</span>
                </div>
              </div>

              <div class="comparacao">
                <div class="comp-row">
                  <span>Odd do Mercado:</span>
                  <span class="comp-value">{{ simulacaoResult.comparacao.oddMercado | number:'1.2-2' }}</span>
                </div>
                <div class="comp-row">
                  <span>Stake:</span>
                  <span class="comp-value">R\$ {{ simulacaoResult.comparacao.stake }}</span>
                </div>
                <div class="comp-row highlight">
                  <span>Lucro Potencial:</span>
                  <span class="comp-value positive">R\$ {{ simulacaoResult.comparacao.potencialLucro }}</span>
                </div>
              </div>
            </div>
          </div>
          <div *ngIf="!selectedOdd" class="no-selection">
            Selecione uma odd acima para simular placares
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .simulador-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
      padding: 1.5rem;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .page-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .page-subtitle {
      color: #94a3b8;
    }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background-color: #334155;
      border-radius: 9999px;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .status-badge.running {
      background-color: #059669;
      color: #fff;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: currentColor;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .card-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: #fff;
      margin: 0;
    }

    .form-row {
      display: flex;
      gap: 1rem;
      align-items: flex-end;
    }

    .form-group {
      flex: 1;
    }

    .form-group label {
      display: block;
      font-size: 0.875rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .form-select, .form-input {
      width: 100%;
      padding: 0.625rem 0.875rem;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      color: #fff;
      font-size: 0.875rem;
    }

    .form-select:focus, .form-input:focus {
      outline: none;
      border-color: #06b6d4;
    }

    .form-select:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .button-group {
      display: flex;
      gap: 0.5rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.625rem 1rem;
      border-radius: 0.5rem;
      font-weight: 500;
      font-size: 0.875rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s ease;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: #06b6d4;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #0891b2;
    }

    .btn-danger {
      background-color: #dc2626;
      color: white;
    }

    .btn-danger:hover:not(:disabled) {
      background-color: #b91c1c;
    }

    .btn-secondary {
      background-color: #475569;
      color: white;
    }

    .btn-secondary:hover {
      background-color: #334155;
    }

    .btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-block {
      width: 100%;
      justify-content: center;
    }

    .btn-icon {
      font-size: 0.75rem;
    }

    .cache-info {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #334155;
    }

    .cache-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background-color: #05966920;
      border: 1px solid #059669;
      border-radius: 0.375rem;
      font-size: 0.75rem;
      color: #059669;
    }

    .logs-card {
      max-height: 400px;
      display: flex;
      flex-direction: column;
    }

    .logs-container {
      flex: 1;
      overflow-y: auto;
      background-color: #0f172a;
      border-radius: 0.5rem;
      padding: 1rem;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 0.75rem;
    }

    .logs-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .connection-status {
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      background-color: #dc262620;
      color: #dc2626;
    }

    .connection-status.connected {
      background-color: #05966920;
      color: #059669;
    }

    .logs-count {
      font-size: 0.75rem;
      color: #64748b;
    }

    .log-entry {
      display: flex;
      gap: 0.5rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid #1e293b;
    }

    .log-timestamp {
      color: #64748b;
      white-space: nowrap;
    }

    .log-level {
      font-weight: 600;
      min-width: 70px;
    }

    .log-message {
      flex: 1;
      color: #e2e8f0;
    }

    .log-step {
      color: #06b6d4;
    }

    .log-info .log-level { color: #3b82f6; }
    .log-success .log-level { color: #22c55e; }
    .log-warn .log-level { color: #f59e0b; }
    .log-error .log-level { color: #ef4444; }
    .log-debug .log-level { color: #8b5cf6; }

    .empty-logs {
      color: #64748b;
      text-align: center;
      padding: 2rem;
    }

    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
    }

    .odds-table-container {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.75rem;
    }

    .data-table th, .data-table td {
      padding: 0.75rem;
      text-align: left;
      border-bottom: 1px solid #334155;
    }

    .data-table th {
      background-color: #0f172a;
      color: #94a3b8;
      font-weight: 600;
    }

    .data-table tr:hover {
      background-color: #0f172a;
    }

    .data-table tr.selected {
      background-color: #06b6d420;
    }

    .text-truncate {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .odd-value {
      font-weight: 600;
      color: #fbbf24;
    }

    .empty-odds {
      color: #64748b;
      text-align: center;
      padding: 2rem;
    }

    .match-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #334155;
    }

    .match-teams {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .match-date {
      font-size: 0.75rem;
      color: #64748b;
    }

    .score-inputs {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .score-input-group {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .score-input-group label {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .score-input {
      width: 60px;
      height: 60px;
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      background-color: #0f172a;
      border: 2px solid #334155;
      border-radius: 0.5rem;
      color: #fff;
    }

    .score-input:focus {
      outline: none;
      border-color: #06b6d4;
    }

    .score-separator {
      font-size: 1.5rem;
      color: #64748b;
    }

    .stake-input {
      margin-bottom: 1rem;
    }

    .stake-input label {
      display: block;
      font-size: 0.875rem;
      color: #94a3b8;
      margin-bottom: 0.5rem;
    }

    .simulacao-result {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: #0f172a;
      border-radius: 0.5rem;
    }

    .result-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .result-placar {
      font-size: 1.25rem;
      font-weight: 700;
      color: #fff;
    }

    .result-recomendacao {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .rec-vitoria-mandante {
      background-color: #22c55e20;
      color: #22c55e;
    }

    .rec-empate {
      background-color: #f59e0b20;
      color: #f59e0b;
    }

    .rec-vitoria-visitante {
      background-color: #3b82f620;
      color: #3b82f6;
    }

    .probabilidades {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #334155;
    }

    .prob-item {
      flex: 1;
      text-align: center;
    }

    .prob-label {
      display: block;
      font-size: 0.75rem;
      color: #64748b;
      margin-bottom: 0.25rem;
    }

    .prob-value {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    .comparacao {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .comp-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.875rem;
      color: #94a3b8;
    }

    .comp-row.highlight {
      padding-top: 0.5rem;
      border-top: 1px solid #334155;
      font-weight: 600;
    }

    .comp-value {
      color: #fff;
    }

    .comp-value.positive {
      color: #22c55e;
    }

    .no-selection {
      color: #64748b;
      text-align: center;
      padding: 2rem;
    }
    
    /* Cards do Robô */
    .cards-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      max-height: 400px;
      overflow-y: auto;
    }
    
    .robot-card {
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      padding: 1rem;
    }
    
    .card-header-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #334155;
    }
    
    .card-indice {
      background-color: #06b6d4;
      color: white;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 600;
    }
    
    .card-titulo {
      font-size: 0.875rem;
      font-weight: 600;
      color: #fff;
    }
    
    .card-padroes {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
      padding: 0.5rem;
      background-color: #1e293b;
      border-radius: 0.25rem;
    }
    
    .padroes-label {
      font-size: 0.75rem;
      color: #64748b;
    }
    
    .padroes-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #22c55e;
    }
    
    /* Tabela de Cards */
    .cards-table-container {
      overflow-x: auto;
      margin-top: 1rem;
    }
    
    .cards-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }
    
    .cards-table th {
      background-color: #334155;
      color: #fff;
      padding: 0.75rem;
      text-align: left;
      font-weight: 600;
      border-bottom: 2px solid #475569;
    }
    
    .cards-table td {
      padding: 0.75rem;
      border-bottom: 1px solid #334155;
      color: #e2e8f0;
    }
    
    .cards-table tr:hover {
      background-color: #1e293b;
    }
    
    .td-titulo {
      font-weight: 500;
      color: #fff;
    }
    
    .td-padroes {
      color: #22c55e;
      font-weight: 600;
    }
    
    .td-percentual {
      color: #f59e0b;
      font-weight: 600;
    }
    
    .td-sg {
      color: #06b6d4;
      text-align: center;
    }
    
    .td-g1 {
      color: #8b5cf6;
      text-align: center;
    }
    
    .td-g2 {
      color: #ec4899;
      text-align: center;
    }
    
    .card-stats {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
    }
    
    .stat-item {
      text-align: center;
    }
    
    .stat-label {
      display: block;
      font-size: 0.625rem;
      color: #64748b;
      text-transform: uppercase;
    }
    
    .stat-value {
      display: block;
      font-size: 1rem;
      font-weight: 700;
      color: #fff;
    }
    
    .stat-value.percent {
      color: #22c55e;
    }

    @media (max-width: 1024px) {
      .two-columns {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .form-row {
        flex-direction: column;
      }

      .button-group {
        width: 100%;
      }

      .button-group .btn {
        flex: 1;
      }
    }
  `]
})
export class SimuladorComponent implements OnInit, OnDestroy {
  credenciais: Credencial[] = [];
  selectedCredencialId = '';
  odds: OddMedia[] = [];
  selectedOddIndex: number = -1;
  selectedOdd: OddMedia | null = null;
  logs: LogEntry[] = [];
  simulacaoResult: Simulacao | null = null;
  robotStatus = { isRunning: false };
  cacheInfo: string | null = null;
  socketConnected = false;
  robotCards: RobotCardData[] = [];

  placarMandante = 0;
  placarVisitante = 0;
  stake = 10;

  private eventSource: EventSource | null = null;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadCredenciais();
    this.loadOdds();
    this.initServerSentEvents();
    this.checkRobotStatus();
  }

  ngOnDestroy() {
    this.disconnectSSE();
  }

  // Usar Server-Sent Events (SSE) em vez de WebSocket
  initServerSentEvents() {
    this.disconnectSSE();
    this.eventSource = new EventSource('http://localhost:3001/api/sse');
    
    this.eventSource.onopen = () => {
      this.socketConnected = true;
    };
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.logs && Array.isArray(data.logs)) {
          this.logs = data.logs;
        } else if (data.id) {
          // Log individual
          this.logs.push(data);
        }
      } catch (e) {
        // Ignorar erros de parse
      }
    };
    
    this.eventSource.onerror = () => {
      this.socketConnected = false;
      // Reconectar após 5 segundos
      setTimeout(() => this.initServerSentEvents(), 5000);
    };
  }

  disconnectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.socketConnected = false;
  }

  loadCredenciais() {
    this.api.getCredenciais().subscribe({
      next: (data: any) => this.credenciais = data,
      error: (err: any) => console.error('Erro ao carregar credenciais:', err)
    });
  }

  loadOdds() {
    this.api.getOddsMedias().subscribe({
      next: (data: any) => this.odds = data,
      error: (err: any) => console.error('Erro ao carregar odds:', err)
    });
  }

  selectOdd(index: number) {
    this.selectedOddIndex = index;
    this.selectedOdd = this.odds[index];
    this.simulacaoResult = null;
  }

  startRobot() {
    if (!this.selectedCredencialId) return;

    this.api.startRobot(this.selectedCredencialId, 'simulador').subscribe({
      next: (result: any) => {
        if (result.success) {
          this.checkRobotStatus();
        }
      },
      error: (err: any) => console.error('Erro ao iniciar robo:', err)
    });
  }

  stopRobot() {
    this.api.stopRobot().subscribe({
      next: (result: any) => {
        if (result.success) {
          this.checkRobotStatus();
          this.loadCachedData();
        }
      },
      error: (err: any) => console.error('Erro ao parar robo:', err)
    });
  }

  checkRobotStatus() {
    this.api.getRobotStatus().subscribe({
      next: (status: any) => {
        this.robotStatus.isRunning = status.isRunning;
        
        if (status.cacheExpiresIn !== null && status.cacheExpiresIn > 0) {
          const minutes = Math.floor(status.cacheExpiresIn / 60000);
          const seconds = Math.floor((status.cacheExpiresIn % 60000) / 1000);
          this.cacheInfo = minutes + 'm ' + seconds + 's';
        } else {
          this.cacheInfo = null;
        }
      }
    });
  }

  loadCachedData() {
    this.api.getRobotCache().subscribe({
      next: (cache: any) => {
        if (cache.data && cache.data.logs) {
          this.logs = cache.data.logs;
        }
      },
      error: () => {}
    });
    
    // Carregar dados dos cards
    this.loadRobotCards();
  }

  loadRobotCards() {
    this.api.getRobotCards().subscribe({
      next: (response: any) => {
        if (response.dadosCards && Array.isArray(response.dadosCards)) {
          this.robotCards = response.dadosCards;
          console.log('Cards carregados:', this.robotCards);
        }
      },
      error: (err: any) => console.error('Erro ao carregar cards:', err)
    });
  }

  clearCache() {
    this.api.clearRobotCache().subscribe({
      next: () => {
        this.cacheInfo = null;
        this.checkRobotStatus();
      }
    });
  }

  simular() {
    if (!this.selectedOdd) return;

    const request = {
      placarMandante: this.placarMandante,
      placarVisitante: this.placarVisitante,
      oddVitoriaMandante: this.selectedOdd.odd_vitoria_mandante,
      oddEmpate: this.selectedOdd.odd_empate,
      oddVitoriaVisitante: this.selectedOdd.odd_vitoria_visitante,
      stake: this.stake
    };

    this.api.simularPlacar(request).subscribe({
      next: (result: any) => {
        this.simulacaoResult = result;
      },
      error: (err: any) => console.error('Erro na simulacao:', err)
    });
  }

  clearLogs() {
    this.logs = [];
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour12: false });
  }
}
