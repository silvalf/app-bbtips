import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="app-container">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <h1 class="logo">BB Tips</h1>
          <p class="subtitle">Manager</p>
        </div>
        
        <nav class="sidebar-nav">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-item">
            <span class="nav-icon">🏠</span>
            <span class="nav-text">Home</span>
          </a>
          <a routerLink="/dashboard" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📊</span>
            <span class="nav-text">Dashboard</span>
          </a>
          <a routerLink="/bancas" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">💰</span>
            <span class="nav-text">Bancas</span>
          </a>
          <a routerLink="/Bot" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">📋</span>
            <span class="nav-text">Padrões</span>
          </a>
          <a routerLink="/simulador" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">🧮</span>
            <span class="nav-text">Simulador</span>
          </a>
          <a routerLink="/configuracoes" routerLinkActive="active" class="nav-item">
            <span class="nav-icon">⚙️</span>
            <span class="nav-text">Configurações</span>
          </a>
        </nav>
        
        <div class="sidebar-footer">
          <div class="server-status">
            <span class="status-dot" [class]="backendOnline ? 'online' : 'offline'"></span>
            <span class="status-text">{{ backendOnline ? 'Backend Online' : 'Backend Offline' }}</span>
          </div>
        </div>
      </aside>
      
      <!-- Main Content -->
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      min-height: 100vh;
    }
    
    .sidebar {
      width: 250px;
      background-color: #1e293b;
      border-right: 1px solid #334155;
      display: flex;
      flex-direction: column;
      padding: 1.5rem;
      position: fixed;
      height: 100vh;
      left: 0;
      top: 0;
    }
    
    .sidebar-header {
      margin-bottom: 2rem;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: 700;
      color: #06b6d4;
    }
    
    .subtitle {
      font-size: 0.875rem;
      color: #94a3b8;
    }
    
    .sidebar-nav {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    
    .nav-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      color: #94a3b8;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    
    .nav-item:hover {
      background-color: #334155;
      color: #fff;
    }
    
    .nav-item.active {
      background-color: #06b6d4;
      color: #fff;
    }
    
    .nav-icon {
      font-size: 1.125rem;
    }
    
    .sidebar-footer {
      border-top: 1px solid #334155;
      padding-top: 1rem;
    }
    
    .server-status {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: #94a3b8;
    }
    
    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
    
    .status-dot.online {
      background-color: #10b981;
    }
    
    .status-dot.offline {
      background-color: #ef4444;
    }
    
    .main-content {
      flex: 1;
      margin-left: 250px;
      padding: 2rem;
      background-color: #0f172a;
      min-height: 100vh;
    }
    
    .status-dot {
      animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `]
})
export class AppComponent {
  backendOnline = true;
}
