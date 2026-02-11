import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { ApiService, Credencial, RobotLogEntry, RobotStatus } from '../../services/api.service';

interface ParametrosBusca {
  maximoPulos: number;
  percentualInicial: number;
  totalRegistros: number;
  stakeInicial: number;
  multiplicador: number;
}

@Component({
  selector: 'app-bots',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  template: `
    <div class="padroes-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Padrões</h1>
          <p class="page-subtitle">Execute o buscador de padrões do BB Tips</p>
        </div>
        <div class="status-badge" [class.running]="robotStatus.isRunning">
          <span class="status-dot"></span>
          {{ robotStatus.isRunning ? 'Robô em Execução' : 'Robô Parado' }}
        </div>
      </div>

      <!-- Seleção de Credencial e Parâmetros -->
      <div class="two-columns">
        <div class="card">
          <h2 class="card-title">Configuração</h2>
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
              <span class="btn-icon">▶</span> Iniciar Robô
            </button>
            <button 
              class="btn btn-danger" 
              (click)="stopRobot()" 
              [disabled]="!robotStatus.isRunning">
              <span class="btn-icon">■</span> Parar Robô
            </button>
          </div>
          <div class="cache-info" *ngIf="cacheInfo">
            <span class="cache-badge">
              <span class="cache-icon">💾</span>
              Cache: {{ cacheInfo }}
            </span>
            <button class="btn btn-sm btn-secondary" (click)="clearCache()">Limpar</button>
          </div>
        </div>

        <div class="card">
          <h2 class="card-title">Parâmetros de Busca</h2>
          <div class="parametros-grid">
            <div class="param-item">
              <label>Máximo Pulos</label>
              <input type="number" [(ngModel)]="parametros.maximoPulos" class="form-input" min="1" max="200">
            </div>
            <div class="param-item">
              <label>% Inicial</label>
              <input type="number" [(ngModel)]="parametros.percentualInicial" class="form-input" min="1" max="100">
            </div>
            <div class="param-item">
              <label>Total Registros</label>
              <input type="number" [(ngModel)]="parametros.totalRegistros" class="form-input" min="1" max="100">
            </div>
            <div class="param-item">
              <label>Stake Inicial (R$)</label>
              <input type="number" [(ngModel)]="parametros.stakeInicial" class="form-input" min="1">
            </div>
            <div class="param-item">
              <label>Multiplicador</label>
              <input type="number" [(ngModel)]="parametros.multiplicador" class="form-input" min="1" step="0.1">
            </div>
            <div class="param-item full-width">
              <button 
                class="btn btn-success btn-block" 
                (click)="executarBuscador()" 
                [disabled]="!robotStatus.isRunning">
                <span class="btn-icon">⚡</span> Executar Buscador de Padrões
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Logs em Tempo Real -->
      <div class="card logs-card">
        <div class="card-header">
          <h2 class="card-title">Logs de Execução</h2>
          <div class="logs-controls">
            <span class="logs-count">{{ logs.length }} eventos</span>
            <div class="progress-info" *ngIf="robotStatus.isRunning">
              <span class="progress-label">Progresso:</span>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="progressPercent"></div>
              </div>
              <span class="progress-percent">{{ progressPercent }}%</span>
            </div>
            <button class="btn btn-sm btn-secondary" (click)="clearLogs()">Limpar</button>
          </div>
        </div>
        <div class="logs-container" #logsContainer>
          <div 
            *ngFor="let log of logs" 
            class="log-entry" 
            [class]="'log-' + log.level.toLowerCase()">
            <span class="log-timestamp">{{ formatTime(log.timestamp) }}</span>
            <span class="log-level">[{{ log.level.padEnd(10) }}]</span>
            <span class="log-message">{{ log.message }}</span>
            <span class="log-step" *ngIf="log.step">#{{ log.step }}</span>
          </div>
          <div *ngIf="logs.length === 0" class="empty-logs">
            Nenhum log ainda. Inicie o robô e execute o buscador de padrões.
          </div>
        </div>
      </div>

      <!-- Resultados -->
      <div class="card" *ngIf="resultadoBusca">
        <div class="card-header">
          <h2 class="card-title">Resultado da Busca</h2>
        </div>
        <div class="resultado-container">
          <div class="resultado-status" [class]="resultadoBusca.sucesso ? 'success' : 'error'">
            <span class="status-icon">{{ resultadoBusca.sucesso ? '✓' : '✗' }}</span>
            <span class="status-text">
              {{ resultadoBusca.sucesso ? 'Busca concluída com sucesso!' : 'Erro na busca: ' + resultadoBusca.erro }}
            </span>
          </div>
          <div class="resultado-details">
            <div class="detail-item">
              <span class="detail-label">Total de Passos:</span>
              <span class="detail-value">{{ resultadoBusca.steps || resultadoBusca.step }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .padroes-container {
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

    .two-columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.5rem;
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
      margin: 0 0 1rem 0;
    }

    .form-group {
      margin-bottom: 1rem;
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
      justify-content: center;
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

    .btn-success {
      background-color: #22c55e;
      color: white;
    }

    .btn-success:hover:not(:disabled) {
      background-color: #16a34a;
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

    .parametros-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .param-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .param-item.full-width {
      grid-column: span 2;
    }

    .param-item label {
      font-size: 0.75rem;
      color: #94a3b8;
    }

    .logs-card {
      max-height: 500px;
      display: flex;
      flex-direction: column;
    }

    .logs-container {
      flex: 1;
      overflow-y: auto;
      background-color: #0f172a;
      border-radius: 0.5rem;
      padding: 1rem;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 0.75rem;
    }

    .logs-controls {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .logs-count {
      font-size: 0.75rem;
      color: #64748b;
    }

    .progress-info {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .progress-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .progress-bar {
      width: 100px;
      height: 6px;
      background-color: #334155;
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: #06b6d4;
      transition: width 0.3s ease;
    }

    .progress-percent {
      font-size: 0.75rem;
      color: #06b6d4;
      min-width: 40px;
    }

    .log-entry {
      display: flex;
      gap: 0.5rem;
      padding: 0.25rem 0;
      border-bottom: 1px solid #1e293b;
      flex-wrap: wrap;
    }

    .log-timestamp {
      color: #64748b;
      white-space: nowrap;
      min-width: 80px;
    }

    .log-level {
      font-weight: 600;
      min-width: 80px;
    }

    .log-message {
      flex: 1;
      color: #e2e8f0;
      min-width: 200px;
    }

    .log-step {
      color: #06b6d4;
      min-width: 40px;
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

    .resultado-container {
      padding: 1rem;
      background-color: #0f172a;
      border-radius: 0.5rem;
    }

    .resultado-status {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      border-radius: 0.5rem;
      margin-bottom: 1rem;
    }

    .resultado-status.success {
      background-color: #22c55e20;
      border: 1px solid #22c55e;
    }

    .resultado-status.error {
      background-color: #ef444420;
      border: 1px solid #ef4444;
    }

    .status-icon {
      font-size: 1.25rem;
      font-weight: bold;
    }

    .resultado-status.success .status-icon { color: #22c55e; }
    .resultado-status.error .status-icon { color: #ef4444; }

    .status-text {
      font-weight: 500;
      color: #fff;
    }

    .resultado-details {
      display: flex;
      gap: 2rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.75rem;
      color: #64748b;
    }

    .detail-value {
      font-size: 1rem;
      font-weight: 600;
      color: #fff;
    }

    @media (max-width: 1024px) {
      .two-columns {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 768px) {
      .button-group {
        flex-direction: column;
      }

      .parametros-grid {
        grid-template-columns: 1fr;
      }

      .param-item.full-width {
        grid-column: span 1;
      }
    }
  `]
})
export class BotsComponent implements OnInit, OnDestroy {
  credenciais: Credencial[] = [];
  selectedCredencialId = '';
  logs: RobotLogEntry[] = [];
  robotStatus: RobotStatus = { isRunning: false, logsCount: 0, cacheExpired: true };
  cacheInfo: string | null = null;
  resultadoBusca: any = null;
  progressPercent = 0;

  parametros: ParametrosBusca = {
    maximoPulos: 80,
    percentualInicial: 50,
    totalRegistros: 10,
    stakeInicial: 10,
    multiplicador: 2
  };

  private pollingInterval: any;
  private logPollingInterval: any;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.loadCredenciais();
    this.checkRobotStatus();
    this.startPolling();
  }

  ngOnDestroy() {
    this.stopPolling();
  }

  loadCredenciais() {
    this.api.getCredenciais().subscribe({
      next: (data: any) => this.credenciais = data,
      error: (err) => console.error('Erro ao carregar credenciais:', err)
    });
  }

  startRobot() {
    if (!this.selectedCredencialId) return;

    this.api.startRobot(this.selectedCredencialId, 'buscador').subscribe({
      next: (result: any) => {
        if (result.success) {
          this.checkRobotStatus();
          this.resultadoBusca = null;
        }
      },
      error: (err) => console.error('Erro ao iniciar robô:', err)
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
      error: (err) => console.error('Erro ao parar robô:', err)
    });
  }

  executarBuscador() {
    if (!this.robotStatus.isRunning) {
      alert('O robô precisa estar em execução!');
      return;
    }

    this.resultadoBusca = null;
    this.progressPercent = 0;

    // Simular progresso baseado nos logs
    const progressInterval = setInterval(() => {
      if (this.progressPercent < 90) {
        this.progressPercent += Math.random() * 10;
      }
    }, 1000);

    // Na implementação real, chamaria o endpoint do robô
    setTimeout(() => {
      clearInterval(progressInterval);
      this.progressPercent = 100;
      this.resultadoBusca = {
        sucesso: true,
        message: 'Fluxo concluído',
        steps: this.logs.length
      };
    }, 5000);
  }

  checkRobotStatus() {
    this.api.getRobotStatus().subscribe({
      next: (status: any) => {
        this.robotStatus = status;
        
        if (status.cacheExpiresIn !== null) {
          const minutes = Math.floor(status.cacheExpiresIn / 60000);
          const seconds = Math.floor((status.cacheExpiresIn % 60000) / 1000);
          this.cacheInfo = `${minutes}m ${seconds}s`;
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
          this.progressPercent = 100;
        }
      },
      error: () => {}
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

  clearLogs() {
    this.logs = [];
    this.progressPercent = 0;
  }

  formatTime(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }

  private startPolling() {
    this.pollingInterval = setInterval(() => {
      this.checkRobotStatus();
    }, 5000);

    this.logPollingInterval = setInterval(() => {
      if (this.logs.length > 0) {
        const lastId = Math.max(...this.logs.map(l => l.id));
        this.api.getRobotLogs(lastId).subscribe({
          next: (result: any) => {
            if (result.logs && result.logs.length > 0) {
              this.logs = [...this.logs, ...result.logs];
            }
          }
        });
      }
    }, 2000);
  }

  private stopPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval);
    if (this.logPollingInterval) clearInterval(this.logPollingInterval);
  }
}
