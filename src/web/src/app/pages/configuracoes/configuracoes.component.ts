import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface ConfiguracaoPerfil {
  id: number;
  notificacoesAtivas: boolean;
  somAlerta: boolean;
  intervaloAtualizacao: number;
  temaAplicacao: string;
  iniciarComWindows: boolean;
  caminhoBancoDados: string | null;
  credencialBBTipsId: string | null;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

interface CredenciaisBots {
  id: string;
  nome: string;
  email: string;
  senha: string;
  urlBase: string;
  timeoutSegundos: number;
  modoDebug: boolean;
  ehPrincipal: boolean;
  ativa: boolean;
  dataCriacao: Date;
  dataAtualizacao: Date;
}

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="config-container">
      <!-- Submenus -->
      <div class="submenu">
        <button class="submenu-btn" [class.active]="activeTab === 'perfil'" (click)="activeTab = 'perfil'">
          👤 Perfil
        </button>
        <button class="submenu-btn" [class.active]="activeTab === 'credenciais'" (click)="activeTab = 'credenciais'">
          🤖 Credenciais Robo
        </button>
      </div>

      <!-- Tab Perfil -->
      <div *ngIf="activeTab === 'perfil'" class="config-card">
        <div class="card-header">
          <h2 class="card-title">Configurações do Perfil</h2>
          <p class="card-description">Gerencie suas preferências do sistema</p>
        </div>

        <div class="card-content">
          <div *ngIf="loadingPerfil" class="loading">
            <span class="spinner"></span>
            <span>Carregando configurações...</span>
          </div>

          <div *ngIf="errorPerfil" class="error-message">
            <span>{{ errorPerfil }}</span>
            <button (click)="loadPerfil()" class="retry-btn">Tentar novamente</button>
          </div>

          <form *ngIf="!loadingPerfil && !errorPerfil" (ngSubmit)="salvarPerfil()" class="config-form">
            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" [(ngModel)]="perfil.notificacoesAtivas" name="notificacoesAtivas">
                Notificações Ativas
              </label>
            </div>

            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" [(ngModel)]="perfil.somAlerta" name="somAlerta">
                Som de Alerta
              </label>
            </div>

            <div class="form-group">
              <label class="form-label">Intervalo de Atualização (segundos)</label>
              <input type="number" [(ngModel)]="perfil.intervaloAtualizacao" name="intervaloAtualizacao" 
                     class="form-input" min="1" max="3600" required>
            </div>

            <div class="form-group">
              <label class="form-label">Tema da Aplicação</label>
              <select [(ngModel)]="perfil.temaAplicacao" name="temaAplicacao" class="form-select">
                <option value="Dark">Dark</option>
                <option value="Light">Light</option>
                <option value="System">System</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" [(ngModel)]="perfil.iniciarComWindows" name="iniciarComWindows">
                Iniciar com Windows
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="save-btn" [disabled]="savingPerfil">
                {{ savingPerfil ? '⏳ Salvando...' : '💾 Salvar' }}
              </button>
              <span *ngIf="successPerfil" class="success-message">{{ successPerfil }}</span>
            </div>
          </form>
        </div>
      </div>

      <!-- Tab Credenciais Robo -->
      <div *ngIf="activeTab === 'credenciais'" class="config-card">
        <div class="card-header">
          <h2 class="card-title">Credenciais do Robô</h2>
          <p class="card-description">Configure as credenciais de acesso ao BB Tips</p>
        </div>

        <div class="card-content">
          <div *ngIf="loadingCredenciais" class="loading">
            <span class="spinner"></span>
            <span>Carregando credenciais...</span>
          </div>

          <div *ngIf="errorCredenciais" class="error-message">
            <span>{{ errorCredenciais }}</span>
            <button (click)="loadCredenciais()" class="retry-btn">Tentar novamente</button>
          </div>

          <form *ngIf="!loadingCredenciais && !errorCredenciais" (ngSubmit)="salvarCredenciais()" class="config-form">
            <div class="form-group">
              <label class="form-label">Nome</label>
              <input type="text" [(ngModel)]="credencial.nome" name="nome" 
                     class="form-input" placeholder="Nome do bot" required>
            </div>

            <div class="form-group">
              <label class="form-label">Email BB Tips</label>
              <input type="email" [(ngModel)]="credencial.email" name="email" 
                     class="form-input" placeholder="seu@email.com" required>
            </div>

            <div class="form-group">
              <label class="form-label">Senha</label>
              <input type="password" [(ngModel)]="credencial.senha" name="senha" 
                     class="form-input" placeholder="Sua senha" required>
            </div>

            <div class="form-group">
              <label class="form-label">URL Base</label>
              <input type="text" [(ngModel)]="credencial.urlBase" name="urlBase" 
                     class="form-input" placeholder="https://app.bbtips.com.br">
            </div>

            <div class="form-group">
              <label class="form-label">
                <input type="checkbox" [(ngModel)]="credencial.ativa" name="ativa">
                Bot Ativo
              </label>
            </div>

            <div class="form-actions">
              <button type="submit" class="save-btn" [disabled]="savingCredenciais">
                {{ savingCredenciais ? '⏳ Salvando...' : '💾 Salvar Credenciais' }}
              </button>
              <span *ngIf="successCredenciais" class="success-message">{{ successCredenciais }}</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .config-container {
      padding: 1.5rem;
    }

    .submenu {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .submenu-btn {
      background-color: #1e293b;
      border: 1px solid #334155;
      color: #94a3b8;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      cursor: pointer;
      transition: all 0.2s;
      font-size: 0.875rem;
    }

    .submenu-btn:hover {
      border-color: #475569;
      color: #fff;
    }

    .submenu-btn.active {
      background-color: #3b82f6;
      border-color: #3b82f6;
      color: white;
    }

    .config-card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.5rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .card-header {
      margin-bottom: 1.5rem;
      border-bottom: 1px solid #334155;
      padding-bottom: 1rem;
    }

    .card-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #fff;
      margin-bottom: 0.25rem;
    }

    .card-description {
      font-size: 0.875rem;
      color: #64748b;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 2rem;
      color: #64748b;
    }

    .spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #334155;
      border-top-color: #3b82f6;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .error-message {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 0.5rem;
      padding: 1rem;
      color: #f87171;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .retry-btn {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      cursor: pointer;
    }

    .config-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .form-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      color: #cbd5e1;
      cursor: pointer;
    }

    .form-label input[type="checkbox"] {
      width: 18px;
      height: 18px;
      accent-color: #3b82f6;
    }

    .form-input, .form-select {
      background-color: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.5rem;
      padding: 0.75rem;
      color: #cbd5e1;
      font-size: 0.875rem;
    }

    .form-input:focus, .form-select:focus {
      outline: none;
      border-color: #3b82f6;
    }

    .form-actions {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid #334155;
    }

    .save-btn {
      background: linear-gradient(to bottom right, #3b82f6, #06b6d4);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      cursor: pointer;
    }

    .save-btn:hover:not(:disabled) {
      opacity: 0.9;
    }

    .save-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .success-message {
      color: #34d399;
      font-size: 0.875rem;
    }
  `]
})
export class ConfiguracoesComponent implements OnInit {
  private apiUrlPerfil = 'http://localhost:5000/api/configuracoesperfil';
  private apiUrlCredenciais = 'http://localhost:5000/api/credenciaisbots';

  activeTab = 'perfil';

  // Perfil
  perfil: ConfiguracaoPerfil = this.getEmptyPerfil();
  loadingPerfil = true;
  savingPerfil = false;
  errorPerfil: string | null = null;
  successPerfil: string | null = null;

  // Credenciais
  credencial: CredenciaisBots = this.getEmptyCredenciaisBots();
  loadingCredenciais = true;
  savingCredenciais = false;
  errorCredenciais: string | null = null;
  successCredenciais: string | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadPerfil();
    this.loadCredenciais();
  }

  getEmptyPerfil(): ConfiguracaoPerfil {
    return {
      id: 0,
      notificacoesAtivas: true,
      somAlerta: true,
      intervaloAtualizacao: 5,
      temaAplicacao: 'Dark',
      iniciarComWindows: false,
      caminhoBancoDados: null,
      credencialBBTipsId: null,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };
  }

  getEmptyCredenciaisBots(): CredenciaisBots {
    return {
      id: '',
      nome: '',
      email: '',
      senha: '',
      urlBase: 'https://app.bbtips.com.br',
      timeoutSegundos: 30,
      modoDebug: false,
      ehPrincipal: false,
      ativa: true,
      dataCriacao: new Date(),
      dataAtualizacao: new Date()
    };
  }

  // Perfil methods
  loadPerfil() {
    this.loadingPerfil = true;
    this.errorPerfil = null;

    this.http.get<ConfiguracaoPerfil>(this.apiUrlPerfil + '/first').subscribe({
      next: (data) => {
        this.perfil = data;
        this.loadingPerfil = false;
      },
      error: (err) => {
        this.loadingPerfil = false;
        if (err.status === 404) {
          this.perfil = this.getEmptyPerfil();
          this.errorPerfil = null;
        } else {
          this.errorPerfil = 'Falha ao carregar configurações.';
        }
      }
    });
  }

  salvarPerfil() {
    this.savingPerfil = true;
    this.successPerfil = null;
    this.errorPerfil = null;

    if (this.perfil.id === 0) {
      this.http.post<ConfiguracaoPerfil>(this.apiUrlPerfil, this.perfil).subscribe({
        next: (data) => {
          this.perfil = data;
          this.savingPerfil = false;
          this.successPerfil = 'Salvo com sucesso!';
          setTimeout(() => this.successPerfil = null, 3000);
        },
        error: (err) => {
          this.savingPerfil = false;
          this.errorPerfil = 'Falha ao salvar.';
        }
      });
    } else {
      this.http.put<ConfiguracaoPerfil>(this.apiUrlPerfil + '/' + this.perfil.id, this.perfil).subscribe({
        next: (data) => {
          this.perfil = data;
          this.savingPerfil = false;
          this.successPerfil = 'Salvo com sucesso!';
          setTimeout(() => this.successPerfil = null, 3000);
        },
        error: (err) => {
          this.savingPerfil = false;
          this.errorPerfil = 'Falha ao salvar.';
        }
      });
    }
  }

  // Credenciais methods
  loadCredenciais() {
    this.loadingCredenciais = true;
    this.errorCredenciais = null;

    this.http.get<CredenciaisBots>(this.apiUrlCredenciais + '/first').subscribe({
      next: (data) => {
        this.credencial = data;
        this.loadingCredenciais = false;
      },
      error: (err) => {
        this.loadingCredenciais = false;
        if (err.status === 404) {
          this.credencial = this.getEmptyCredenciaisBots();
          this.errorCredenciais = null;
        } else {
          this.errorCredenciais = 'Falha ao carregar credenciais.';
        }
      }
    });
  }

  salvarCredenciais() {
    this.savingCredenciais = true;
    this.successCredenciais = null;
    this.errorCredenciais = null;

    if (!this.credencial.id) {
      this.http.post<CredenciaisBots>(this.apiUrlCredenciais, this.credencial).subscribe({
        next: (data) => {
          this.credencial = data;
          this.savingCredenciais = false;
          this.successCredenciais = 'Credenciais salvas!';
          setTimeout(() => this.successCredenciais = null, 3000);
        },
        error: (err) => {
          this.savingCredenciais = false;
          this.errorCredenciais = 'Falha ao salvar credenciais.';
        }
      });
    } else {
      this.http.put<CredenciaisBots>(this.apiUrlCredenciais + '/' + this.credencial.id, this.credencial).subscribe({
        next: (data) => {
          this.credencial = data;
          this.savingCredenciais = false;
          this.successCredenciais = 'Credenciais salvas!';
          setTimeout(() => this.successCredenciais = null, 3000);
        },
        error: (err) => {
          this.savingCredenciais = false;
          this.errorCredenciais = 'Falha ao salvar credenciais.';
        }
      });
    }
  }
}
