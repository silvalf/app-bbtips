import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { BancasComponent } from './pages/bancas/bancas.component';
import { BotsComponent } from './pages/bots/bots.component';
import { SimuladorComponent } from './pages/simulador/simulador.component';
import { ConfiguracoesComponent } from './pages/configuracoes/configuracoes.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'bancas', component: BancasComponent },
  { path: 'Bot', component: BotsComponent },
  { path: 'simulador', component: SimuladorComponent },
  { path: 'configuracoes', component: ConfiguracoesComponent },
  { path: '**', redirectTo: '' }
];
