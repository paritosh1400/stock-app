import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { EventEmitter } from '@angular/core';
import { map } from 'rxjs/operators';

interface AutocompleteItem {
  displaySymbol: string;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private baseUrl = "https://stock-app-o2okdwm6na-uc.a.run.app";

  constructor(private http: HttpClient) {}

  private searchResultSource = new BehaviorSubject<any>(null);
  currentSearchResult$ = this.searchResultSource.asObservable();

  private priceResultSource = new BehaviorSubject<any>(null);
  currentPriceResult$ = this.priceResultSource.asObservable();

  private tickerSource = new BehaviorSubject<string>('');
  currentTicker$ = this.tickerSource.asObservable();

  public dataLoaded: EventEmitter<boolean> = new EventEmitter();
  
  searchStock(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchStock?ticker=${encodeURIComponent(ticker)}`);
  }

  searchPrice(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchPrice?ticker=${encodeURIComponent(ticker)}`);
  }

  updateSearchResult(data: any) {
    this.searchResultSource.next(data);
  }

  updatePriceResult(data: any) {
    this.priceResultSource.next(data);
  }

  updateTicker(ticker: string) {
    this.tickerSource.next(ticker);
  }  

  searchPeer(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchPeer?ticker=${encodeURIComponent(ticker)}`);
  }

  searchNews(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchNews?ticker=${encodeURIComponent(ticker)}`);
  }

  searchTrends(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchTrends?ticker=${encodeURIComponent(ticker)}`);
  }

  searchSent(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchSent?ticker=${encodeURIComponent(ticker)}`);
  }

  searchEarn(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchEarn?ticker=${encodeURIComponent(ticker)}`);
  }

  searchHist(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchHist?ticker=${encodeURIComponent(ticker)}`);
  }

  searchHour(ticker: string) {
    return this.http.get(`${this.baseUrl}/searchHour?ticker=${encodeURIComponent(ticker)}`);
  }

  getautocomplete(term: string): Observable<AutocompleteItem[]> {
    return this.http.get<any>(`${this.baseUrl}/getautocomplete`, { 
      params: new HttpParams().set('term', term) 
    }).pipe(
      map(response => {
        return response.result.map((item: any) => ({
          displaySymbol: item.displaySymbol,
          description: item.description
        }));
      })
    );
  }
}