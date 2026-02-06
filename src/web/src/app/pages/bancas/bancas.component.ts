import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-bancas',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="bancas-container">
      <div class="page-header">
        <div>
          <h1 class="page-title">Bancas</h1>
          <p class="page-subtitle">Gerencie suas bancas de apostas</p>
        </div>
        <button class="btn btn-primary" (click)="showModal = true">
          <span>+</span> Nova Banca
        </button>
      </div>
      
      <div class="card">
        <div class="card-content" *ngIf="loading">
          <div class="loading">Carregando bancas...</div>
        </div>
        
        <div class="card-content" *ngIf="!loading && bancas.length === 0">
          <div class="empty-state">
            <p>Nenhuma banca cadastrada ainda.</p>
            <button class="btn btn-primary" (click)="showModal = true">
              Adicionar primeira banca
            </button>
          </div>
        </div>
        
        <div class="card-content" *ngIf="!loading && bancas.length > 0">
          <div class="bancas-list">
            <div class="banca-item" *ngFor="let banca of bancas">
              <div class="banca-info">
                <h3 class="banca-name">{{ banca.nome }}</h3>
                <p class="banca-details">
                  Saldo: {{ formatCurrency(banca.saldoInicial) }} | 
                  Stop: {{ banca.stopLoss }}% / {{ banca.stopGain }}%
                </p>
              </div>
              <div class="banca-actions">
                <button class="btn btn-secondary" (click)="editBanca(banca)">Editar</button>
                <button class="btn btn-danger" (click)="deleteBanca(banca.id)">Excluir</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Modal -->
      <div class="modal-overlay" *ngIf="showModal">
        <div class="modal">
          <div class="modal-header">
            <h2>{{ editingBanca ? 'Editar Banca' : 'Adicionar Banca' }}</h2>
            <button class="modal-close" (click)="closeModal()">×</button>
          </div>
          <form (submit)="saveBanca($event)">
            <div class="form-group">
              <label>Nome da Banca</label>
              <input type="text" name="nome" [(ngModel)]="formData.nome" required>
            </div>
            <div class="form-group">
              <label>Saldo Inicial</label>
              <input type="text" name="saldoInicial" [(ngModel)]="formData.saldoInicial" required>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Stop Loss %</label>
                <input type="text" name="stopLoss" [(ngModel)]="formData.stopLoss" required>
              </div>
              <div class="form-group">
                <label>Stop Gain %</label>
                <input type="text" name="stopGain" [(ngModel)]="formData.stopGain" required>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Stake Base</label>
                <input type="text" name="stakeBase" [(ngModel)]="formData.stakeBase" required>
              </div>
              <div class="form-group">
                <label>% sobre Banca</label>
                <input type="text" name="stakePercent" [(ngModel)]="formData.stakePercent" required>
              </div>
            </div>
            <div class="form-actions">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancelar</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                {{ saving ? 'Salvando...' : (editingBanca ? 'Atualizar' : 'Salvar') }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bancas-container { display: flex; flex-direction: column; gap: 1.5rem; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 700; color: #fff; margin-bottom: 0.25rem; }
    .page-subtitle { color: #94a3b8; }
    .card { background-color: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem; }
    .card-content { min-height: 200px; }
    .loading, .empty-state { display: flex; align-items: center; justify-content: center; padding: 3rem; color: #64748b; flex-direction: column; gap: 1rem; text-align: center; }
    .bancas-list { display: flex; flex-direction: column; gap: 1rem; }
    .banca-item { display: flex; justify-content: space-between; align-items: center; padding: 1rem; background-color: #0f172a; border-radius: 0.5rem; border: 1px solid #334155; }
    .banca-name { font-weight: 600; color: #fff; margin-bottom: 0.25rem; }
    .banca-details { font-size: 0.875rem; color: #94a3b8; }
    .banca-actions { display: flex; gap: 0.5rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; border: none; font-size: 0.875rem; transition: all 0.2s ease; }
    .btn-primary { background-color: #06b6d4; color: white; }
    .btn-primary:hover { background-color: #0891b2; }
    .btn-secondary { background-color: #334155; color: #cbd5e1; }
    .btn-secondary:hover { background-color: #475569; }
    .btn-danger { background-color: #ef4444; color: white; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .modal { background-color: #1e293b; border: 1px solid #334155; border-radius: 0.75rem; padding: 1.5rem; width: 100%; max-width: 400px; }
    .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .modal-header h2 { font-size: 1.25rem; font-weight: 600; color: #fff; }
    .modal-close { background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer; }
    .modal-close:hover { color: #fff; }
    .form-group { margin-bottom: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group label { display: block; font-size: 0.875rem; color: #cbd5e1; margin-bottom: 0.5rem; }
    .form-group input { width: 100%; padding: 0.625rem 0.875rem; background-color: #334155; border: 1px solid #475569; border-radius: 0.5rem; color: #fff; font-size: 0.875rem; }
    .form-group input:focus { outline: none; border-color: #06b6d4; }
    .form-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #334155; }
  `]
})
export class BancasComponent {
  showModal = false;
  editingBanca: any = null;
  saving = false;
  loading = false;
  bancas: any[] = [];
  
  formData = {
    nome: '',
    saldoInicial: '',
    stopLoss: '20',
    stopGain: '30',
    stakeBase: '10,00',
    stakePercent: '2'
  };

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  }

  async saveBanca(event: Event) {
    event.preventDefault();
    this.saving = true;
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.saving = false;
    this.closeModal();
  }

  editBanca(banca: any) {
    this.editingBanca = banca;
    this.formData = { ...banca };
    this.showModal = true;
  }

  async deleteBanca(id: number) {
    if (confirm('Tem certeza que deseja excluir esta banca?')) {
      this.bancas = this.bancas.filter(b => b.id !== id);
    }
  }

  closeModal() {
    this.showModal = false;
    this.editingBanca = null;
    this.formData = { nome: '', saldoInicial: '', stopLoss: '20', stopGain: '30', stakeBase: '10,00', stakePercent: '2' };
  }
}
