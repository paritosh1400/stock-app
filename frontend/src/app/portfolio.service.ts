import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, forkJoin, throwError } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PortfolioService {
  private baseUrl = "https://stock-app-875463449887.us-central1.run.app/api";  

  private walletSource = new BehaviorSubject<number>(25000);
  currentWallet = this.walletSource.asObservable();

  private priceSource = new BehaviorSubject<[string, number]>(['', 0]);
  currentPrice$ = this.priceSource.asObservable();

  private messageSource = new BehaviorSubject<string>('');
  currentMessage$ = this.messageSource.asObservable();

  constructor(private http: HttpClient) { 
    this.fetchWallet();
  }

  updateMessage(message: string) {
    this.messageSource.next(message);
  }

  checkStockExists(ticker: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/portfolio/exists/${ticker}`);
  }

  updateCurrentPrice(ticker: string, price: number) {
    this.priceSource.next([ticker, price]);
  }

  fetchWallet() {
    this.http.get<{amount: number}>(`${this.baseUrl}/wallet`).subscribe({
      next: (data) => {
        this.walletSource.next(data.amount);
      },
      error: (error) => console.error('Failed to fetch wallet amount', error)
    });
  }

  updateWallet(amount: number) {
    return this.http.put(`${this.baseUrl}/wallet`, { amount }).pipe(
      tap(() => {
        this.walletSource.next(amount);
      }),
      catchError(error => {
        console.error('Failed to update wallet amount', error);
        return throwError(() => new Error('Failed to update wallet amount'));
      })
    );
  }

  buyStock(ticker: string, name: string, price: number, quantity: number, purchaseAmount: number) {
    const averageCost = purchaseAmount / quantity;
    const dataToSend = { ticker, name, price, quantity, total: purchaseAmount, averageCost };

    const portfolioUpdate = this.http.post(`${this.baseUrl}/portfolio`, dataToSend);
    const walletUpdate = this.updateWallet(this.walletSource.value - purchaseAmount);

    return forkJoin([portfolioUpdate, walletUpdate]).pipe(
      catchError(error => {
        console.error('Error updating portfolio or wallet', error);
        return throwError(() => new Error('Error updating portfolio or wallet'));
      })
    );
  }

  getPortfolio() {
    return this.http.get(`${this.baseUrl}/portfolio`);
  }

  getStockQuantity(ticker: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/portfolio/quantity/${ticker}`);
  }

  sellStock(ticker: string, price: number, quantity: number): Observable<any> {
    const saleTotal = price * quantity;
    const portfolioUpdate = this.http.post(`${this.baseUrl}/portfolio/sell`, { ticker, quantity });
    const walletUpdate = this.updateWallet(this.walletSource.value + saleTotal);

    return forkJoin([portfolioUpdate, walletUpdate]).pipe(
      catchError(error => {
        console.error('Error selling stock or updating wallet', error);
        return throwError(() => new Error('Error selling stock or updating wallet'));
      })
    );
  }

  resetCurrentMessage() {
    this.messageSource.next('');
  }

  getTicker() {
    return this.http.get(`${this.baseUrl}/portfolio/ticker`);
  }

  updatepriceindb(tickerPrices: [string, number][]): Observable<any> {
    return this.http.post(`${this.baseUrl}/portfolio/update`, { tickerPrices });
  }
}