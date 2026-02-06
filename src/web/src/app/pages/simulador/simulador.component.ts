import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-simulador',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="simulador-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Simulador</h1>
          <p class="page-subtitle">Teste suas estratégias antes de aplicar</p>
        </div>
      </div>
      
      <div class="card">
        <div class="empty-state">
          <p>Configure suas bancas e padrões para usar o simulador.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .simulador-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
    .page-subtitle { color: #94a3b8; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem; }
    .empty-state { display: flex; align-items: center; justify-content: center; padding: 3rem; color: #64748b; text-align: center; }
  `]
})
export class SimuladorComponent {}
