import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  template: `
    <div class="app-container">
      <header class="header">
        <h1>🤖 BB Tips</h1>
        <nav>
          <a routerLink="/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/bots" routerLinkActive="active">Bots</a>
          <a routerLink="/logs" routerLinkActive="active">Logs</a>
        </nav>
      </header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #1a1a2e;
      color: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 2rem;
      background: #16213e;
      border-bottom: 1px solid #0f3460;
    }
    .header h1 {
      margin: 0;
      font-size: 1.5rem;
    }
    .header nav a {
      color: #a0a0a0;
      text-decoration: none;
      margin-left: 1.5rem;
      padding: 0.5rem 1rem;
      border-radius: 4px;
      transition: all 0.2s;
    }
    .header nav a:hover,
    .header nav a.active {
      color: #fff;
      background: #0f3460;
    }
    .main-content {
      padding: 2rem;
    }
  `]
})
export class AppComponent {
  title = 'BB Tips';
}
