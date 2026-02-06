import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-container">
      <div class="page-header">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Visão geral de todas as bancas</p>
      </div>
      
      <div class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">Saldo Total</p>
          <p class="stat-value">R$ 0,00</p>
          <p class="stat-change positive">+0%</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Lucro Mensal</p>
          <p class="stat-value">R$ 0,00</p>
          <p class="stat-change positive">+0%</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Assertividade</p>
          <p class="stat-value">0%</p>
          <p class="stat-change neutral">0%</p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Bancas Ativas</p>
          <p class="stat-value">0</p>
        </div>
      </div>
      
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">Histórico de Operações</h2>
          <p class="card-description">Nenhuma operação registrada ainda</p>
        </div>
        <div class="card-content">
          <div class="empty-state">
            <p>Configure suas bancas para começar a registrar operações</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    
    .page-header {
      margin-bottom: 1rem;
    }
    
    .page-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin-bottom: 0.25rem;
    }
    
    .page-subtitle {
      color: #94a3b8;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }
    
    .stat-card {
      background-color: #1e293b;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.5rem;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #94a3b8;
    }
    
    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin-top: 0.25rem;
    }
    
    .stat-change {
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }
    
    .stat-change.positive { color: #34d399; }
    .stat-change.negative { color: #f87171; }
    .stat-change.neutral { color: #94a3b8; }
    
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
      font-size: 1.125rem;
      font-weight: 600;
      color: #fff;
    }
    
    .card-description {
      font-size: 0.875rem;
      color: #64748b;
      margin-top: 0.25rem;
    }
    
    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 3rem;
      color: #64748b;
      text-align: center;
    }
  `]
})
export class DashboardComponent {}
