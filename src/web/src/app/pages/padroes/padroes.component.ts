import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-padroes',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="padroes-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Padrões</h1>
          <p class="page-subtitle">Gerencie seus padrões de apostas</p>
        </div>
        <button class="btn btn-primary">
          <span>+</span> Novo Padrão
        </button>
      </div>
      
      <div class="card">
        <div class="empty-state">
          <p>Nenhum padrão cadastrado ainda.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .padroes-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
    .page-subtitle { color: #94a3b8; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem; }
    .empty-state { display: flex; align-items: center; justify-content: center; padding: 3rem; color: #64748b; text-align: center; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; border: none; font-size: 0.875rem; transition: all 0.2s ease; }
    .btn-primary { background-color: #06b6d4; color: white; }
    .btn-primary:hover { background-color: #0891b2; }
  `]
})
export class PadroesComponent {}
