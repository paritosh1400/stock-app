import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class WatchlistService {
  private baseUrl = "https://stock-app-o2okdwm6na-uc.a.run.app";  

  private watchlistSource = new BehaviorSubject<any[]>([]);
  currentWatchlist = this.watchlistSource.asObservable();

  private messageSource = new BehaviorSubject<string>('');
  currentMessage = this.messageSource.asObservable();

  private triggerSearchSubject = new BehaviorSubject<string | null>(null);
  triggerSearch$ = this.triggerSearchSubject.asObservable();

  constructor(private http: HttpClient) {}

  triggerSearch(ticker: string) {
    this.triggerSearchSubject.next(ticker);
  }

  clearTrigger() {
    this.triggerSearchSubject.next(null);
  }

  addToWatchlist(stock: { ticker: string; name: string; pricec: number; priced: number; pricedp: number;}) {
    this.getWatchlist().subscribe(currentList => {
      const stockExists = currentList.some(item => item.ticker == stock.ticker);

      if (!stockExists) {
        this.http.post(`${this.baseUrl}/addwatchlist`, stock).subscribe({
          next: (response) => {
            console.log("Stock added to database", response);
            this.fetchAndUpdateWatchlistFromDb().subscribe(); // refresh watchlist
            this.setMessage(`${stock.ticker} added to watchlist`);
          },
          error: (error) => console.error("Failed", error)
        });
      } else {
        console.log('Stock already exists in watchlist');
      }
    });
  }

  getWatchlist(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/getwatchlist`);
  }

  fetchAndUpdateWatchlistFromDb(): Observable<any[]> {
    return this.getWatchlist().pipe(
      tap(watchlist => {
        this.watchlistSource.next(watchlist);
      }),
      catchError(error => {
        console.error('Failed to fetch watchlist from db', error);
        return throwError(() => new Error('Failed to fetch watchlist from db'));
      })
    );
  }

  removeFromWatchlist(ticker: string): Observable<any> {
    return this.http.delete(`${this.baseUrl}/delwatchlist/${ticker}`);
  }

  setMessage(message: string) {
    this.messageSource.next(message);
  }

  clearMessage() {
    this.messageSource.next('');
  }

  updateMessage(message: string) {
    this.messageSource.next(message);
  }
}