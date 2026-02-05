import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Bot {
  id: number;
  name: string;
  platform: string;
  game: string;
  status: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Log {
  id: number;
  level: string;
  message: string;
  details?: string;
  timestamp: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) { }

  // Bots
  getBots(): Observable<Bot[]> {
    return this.http.get<Bot[]>(`${this.apiUrl}/bots`);
  }

  getBot(id: number): Observable<Bot> {
    return this.http.get<Bot>(`${this.apiUrl}/bots/${id}`);
  }

  createBot(bot: Partial<Bot>): Observable<Bot> {
    return this.http.post<Bot>(`${this.apiUrl}/bots`, bot);
  }

  updateBot(id: number, bot: Partial<Bot>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/bots/${id}`, bot);
  }

  deleteBot(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/bots/${id}`);
  }

  // Logs
  getLogs(): Observable<Log[]> {
    return this.http.get<Log[]>(`${this.apiUrl}/logs`);
  }
}
