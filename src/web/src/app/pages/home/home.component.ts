import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="home-container">
      <!-- Welcome Section -->
      <div class="welcome-card">
        <h1 class="welcome-title">Bem-vindo ao BB Tips Manager</h1>
        <p class="welcome-subtitle">Sistema de gerenciamento de bancas e padrões para apostas esportivas.</p>
      </div>

      <!-- Status Cards -->
      <div class="status-grid">
        <!-- Server Status -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Status dos Servidores</h2>
          </div>
          <div class="card-content">
            <div class="status-item">
              <div class="status-indicator">
                <span class="status-dot" [class.online]="backendStatus === 'online'" 
                      [class.offline]="backendStatus === 'offline'"
                      [class.checking]="backendStatus === 'checking'"></span>
                <div>
                  <a href="http://localhost:5000" target="_blank" class="status-label">Backend API</a>
                  <p class="status-value" [class.online]="backendStatus === 'online'"
                     [class.offline]="backendStatus === 'offline'">
                    {{ getStatusText(backendStatus) }}
                  </p>
                </div>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-indicator">
                <span class="status-dot" [class.online]="databaseStatus === 'connected'"
                      [class.offline]="databaseStatus === 'error'"
                      [class.checking]="databaseStatus === 'checking'"></span>
                <div>
                  <a href="http://localhost:5000/api/health" target="_blank" class="status-label">SQL Server</a>
                  <p class="status-value" [class.online]="databaseStatus === 'connected'"
                     [class.offline]="databaseStatus === 'error'">
                    {{ getDatabaseStatusText(databaseStatus) }}
                  </p>
                </div>
              </div>
            </div>
            
            <div class="status-item">
              <div class="status-indicator">
                <span class="status-dot online"></span>
                <div>
                  <span class="status-label">Frontend</span>
                  <p class="status-value online">Online</p>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <button (click)="retryCheck()" class="retry-btn" [disabled]="backendStatus === 'checking'">
              {{ backendStatus === 'checking' ? 'Verificando...' : 'Reintentar' }}
            </button>
            <span *ngIf="lastChecked" class="last-checked">Última verificação: {{ formatLastChecked() }}</span>
          </div>
        </div>

        <!-- API Response -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">
              <a href="http://localhost:5000/swagger" target="_blank">API Response (docs)</a>
            </h2>
          </div>
          <div class="card-content">
            <div class="api-response">
              <span *ngIf="apiMessage" class="api-badge">200 OK</span>
              <span *ngIf="apiMessage" class="api-message">{{ apiMessage }}</span>
              <span *ngIf="!apiMessage" class="api-loading">Aguardando resposta...</span>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="card">
          <div class="card-header">
            <h2 class="card-title">Acesso Rápido</h2>
            <p class="card-description">Navegue rapidamente para as principais funcionalidades</p>
          </div>
          <div class="card-content">
            <div class="quick-actions">
              <a routerLink="/dashboard" class="quick-action-item">
                <div class="action-icon bg-blue">📊</div>
                <span>Dashboard</span>
              </a>
              <a routerLink="/bancas" class="quick-action-item">
                <div class="action-icon bg-green">💰</div>
                <span>Bancas</span>
              </a>
              <a routerLink="/padroes" class="quick-action-item">
                <div class="action-icon bg-purple">📋</div>
                <span>Padrões</span>
              </a>
              <a routerLink="/simulador" class="quick-action-item">
                <div class="action-icon bg-amber">🧮</div>
                <span>Simulador</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .welcome-card {
      background: linear-gradient(to bottom right, #1e293b, #0f172a);
      border: 1px solid #334155;
      border-radius: 1rem;
      padding: 1.5rem;
    }
    
    .welcome-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.5rem;
    }
    
    .welcome-subtitle {
      color: #94a3b8;
    }
    
    .status-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    
    .card-header {
      margin-bottom: 1rem;
    }
    
    .card-title {
      font-size: 0.875rem;
      font-weight: 500;
      color: #94a3b8;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    
    .card-title a {
      color: #94a3b8;
    }
    
    .card-title a:hover {
      color: #fff;
    }
    
    .card-description {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
    
    .card-content {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    
    .status-indicator {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1rem;
      background-color: #0f172a;
      border-radius: 0.5rem;
    }
    
    .status-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    
    .status-dot.online { background-color: #10b981; }
    .status-dot.offline { background-color: #ef4444; }
    .status-dot.checking { background-color: #f59e0b; }
    
    .status-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
    }
    
    .status-value {
      font-size: 0.75rem;
    }
    
    .status-value.online { color: #34d399; }
    .status-value.offline { color: #f87171; }
    .status-value.checking { color: #fbbf24; }
    
    .api-response {
      background-color: #0f172a;
      border-radius: 0.5rem;
      padding: 1rem;
      border: 1px solid #334155;
    }
    
    .api-badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.5rem;
      background-color: rgba(16, 185, 129, 0.1);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 0.25rem;
      font-size: 0.75rem;
      margin-right: 0.5rem;
    }
    
    .api-message {
      color: #cbd5e1;
    }
    
    .api-loading {
      color: #64748b;
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }
    
    .quick-action-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
      padding: 1rem;
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      text-decoration: none;
      color: #cbd5e1;
      transition: all 0.2s ease;
    }
    
    .quick-action-item:hover {
      border-color: #475569;
      color: #fff;
    }
    
    .action-icon {
      width: 40px;
      height: 40px;
      border-radius: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
    }
    
    .bg-blue { background: linear-gradient(to bottom right, #3b82f6, #06b6d4); }
    .bg-green { background: linear-gradient(to bottom right, #10b981, #22c55e); }
    .bg-purple { background: linear-gradient(to bottom right, #8b5cf6, #ec4899); }
    .bg-amber { background: linear-gradient(to bottom right, #f59e0b, #f97316); }
    
    .card-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #334155;
    }
    
    .retry-btn {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-size: 0.875rem;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    
    .retry-btn:hover:not(:disabled) {
      background-color: #2563eb;
    }
    
    .retry-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    
    .last-checked {
      font-size: 0.75rem;
      color: #64748b;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  backendStatus = 'checking';
  databaseStatus = 'checking';
  apiMessage: string | null = null;
  lastChecked: Date | null = null;
  private retryCount = 0;
  private maxRetries = 3;
  private pollingInterval: any;

  ngOnInit() {
    this.checkServerStatusWithRetry();
    // Polling a cada 30 segundos
    this.pollingInterval = setInterval(() => this.checkServerStatusWithRetry(), 30000);
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'online': return 'Online';
      case 'offline': return 'Offline';
      default: return 'Verificando...';
    }
  }

  getDatabaseStatusText(status: string): string {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'error': return 'Erro';
      default: return 'Verificando...';
    }
  }

  async checkServerStatusWithRetry() {
    this.backendStatus = 'checking';
    this.databaseStatus = 'checking';
    
    // Verificar backend (endpoint raiz)
    const backendController = new AbortController();
    const backendTimeout = setTimeout(() => backendController.abort(), 5000);
    
    try {
      const backendResponse = await fetch('http://localhost:5000/', {
        signal: backendController.signal
      });
      clearTimeout(backendTimeout);
      
      if (backendResponse.ok) {
        this.backendStatus = 'online';
        
        // Só verificar database se backend estiver online
        const dbController = new AbortController();
        const dbTimeout = setTimeout(() => dbController.abort(), 5000);
        
        try {
          const dbResponse = await fetch('http://localhost:5000/api/health/database', {
            signal: dbController.signal
          });
          clearTimeout(dbTimeout);
          
          if (dbResponse.ok) {
            this.databaseStatus = 'connected';
            this.apiMessage = 'API Health Check OK';
          } else {
            this.databaseStatus = 'error';
            this.apiMessage = null;
          }
        } catch (error) {
          clearTimeout(dbTimeout);
          this.databaseStatus = 'error';
        }
      } else {
        this.backendStatus = 'offline';
        this.databaseStatus = 'error';
        this.apiMessage = null;
      }
    } catch (error) {
      clearTimeout(backendTimeout);
      this.backendStatus = 'offline';
      this.databaseStatus = 'error';
      this.apiMessage = null;
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        setTimeout(() => this.checkServerStatusWithRetry(), 2000 * this.retryCount);
        return;
      }
    }
    
    this.lastChecked = new Date();
    this.retryCount = 0;
  }

  retryCheck() {
    this.retryCount = 0;
    this.checkServerStatusWithRetry();
  }

  formatLastChecked(): string {
    if (!this.lastChecked) return '';
    return this.lastChecked.toLocaleTimeString('pt-BR');
  }
}
