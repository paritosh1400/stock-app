import { Component, OnInit, Output, EventEmitter, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { BackendService } from '../../backend.service';
import { WatchlistService } from '../../watchlist.service'; 
import { PortfolioService } from '../../portfolio.service';
import { ViewChild } from '@angular/core';
import { BuyModalComponent } from '../buy-modal/buy-modal.component';
import { SellModalComponent } from '../sell-modal/sell-modal.component';
// import { isPlatformBrowser } from '@angular/common';
//Change if wrong

declare var bootstrap: any;

@Component({
  selector: 'app-stock-display',
  templateUrl: './stock-display.component.html',
  styleUrl: './stock-display.component.css'
})

export class StockDisplayComponent implements OnInit {
  stockData: any;
  priceData: any;
  ticker: any;
  @Output() peerChanged: EventEmitter<string> = new EventEmitter<string>();

  pricec: number = 0;
  priced: number = 0;
  pricedp: number = 0;
  formattedDate: string = '';
  currentDate: string = '';
  message: string = '';
  stockExists: boolean = false;

  inWatchlist: boolean = false;
  successMessage: string = '';
  isStockInWatchlist: boolean = false;


  @Output() addToWatchlist = new EventEmitter<string>();

  private priceUpdateInterval: any;

  @ViewChild('buyModal') buyModalComponent!: BuyModalComponent;
  @ViewChild('sellModal') sellModalComponent!: SellModalComponent;

 
  displaySuccessMessage(message: string) {
    this.successMessage = message;
    setTimeout(() => this.successMessage = '', 5000); 
  }

  clearSuccessMessage() {
    this.successMessage = '';
  }
  
  onPeerSelected(peerSymbol: string): void{
    this.peerChanged.emit(peerSymbol);
  }

  constructor(private backService: BackendService,
              private watchlistService: WatchlistService,
              private portfolioService: PortfolioService) {}
              // @Inject(PLATFORM_ID) private platformId: Object) {} //Change if wrong


  emitAddToWatchlist() {
    this.watchlistService.addToWatchlist({
      ticker: this.stockData.ticker,
      name: this.stockData.name,
      pricec: this.pricec,
      priced: this.priced,
      pricedp: this.pricedp
    });
    // this.watchlistService.setMessage(`${this.stockData.ticker} added to watchlist`);
    this.isStockInWatchlist = true;
  }

  calculateroundoff(){
    if (this.priceData) {
      this.pricec = parseFloat(this.priceData.c.toFixed(2));
      this.priced = parseFloat(this.priceData.d.toFixed(2));
      this.pricedp = parseFloat(this.priceData.dp.toFixed(2));

      this.portfolioService.updateCurrentPrice(this.ticker, this.pricec);
    }
  }

  //Converts Unix Epoch to Date
  convertEpochToDate(epoch: number): void {
    const dateObj = new Date(epoch * 1000); 
    const year = dateObj.getFullYear();
    const month = ('0' + (dateObj.getMonth() + 1)).slice(-2); 
    const day = ('0' + dateObj.getDate()).slice(-2);
    const hours = ('0' + dateObj.getHours()).slice(-2);
    const minutes = ('0' + dateObj.getMinutes()).slice(-2);
    const seconds = ('0' + dateObj.getSeconds()).slice(-2);
    this.formattedDate = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  isMarketClosed(): boolean {
    const currentDate = new Date();
    const formattedDateObj = new Date(this.formattedDate);

    const diffMs = currentDate.getTime() - formattedDateObj.getTime(); 
    const diffMins = diffMs / (1000 * 60); 
  
    return diffMins > 5;
  }

  getCurrentDateTime(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = ('0' + (now.getMonth() + 1)).slice(-2); 
    const day = ('0' + now.getDate()).slice(-2); 
    const hours = ('0' + now.getHours()).slice(-2); 
    const minutes = ('0' + now.getMinutes()).slice(-2); 
    const seconds = ('0' + now.getSeconds()).slice(-2); 
  
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  updatePriceData(): void {
    if (this.isMarketClosed()) {
      clearInterval(this.priceUpdateInterval); 
      return;
    }

    this.backService.searchPrice(this.ticker).subscribe(data => {
      this.priceData = data;
      this.calculateroundoff();
      this.convertEpochToDate(this.priceData.t);
    });
  }

  ngOnInit() {

    // if (isPlatformBrowser(this.platformId)) {
    //   this.loadFromLocalStorage();
    // }

    this.backService.currentSearchResult$.subscribe(data => {
      this.stockData = data;
      // localStorage.setItem('stockData', JSON.stringify(data)); //r
    });
    this.backService.currentPriceResult$.subscribe(data => {
      this.priceData = data;
      this.calculateroundoff();
      this.convertEpochToDate(this.priceData.t);
      this.currentDate = this.getCurrentDateTime();
      // localStorage.setItem('priceData', JSON.stringify(data)); //R
    });
    this.backService.currentTicker$.subscribe(ticker=> {
      this.ticker = ticker;
    });

    this.priceUpdateInterval = setInterval(() => this.updatePriceData(), 15000);
    this.watchlistService.currentMessage.subscribe((msg: string) => this.message = msg);
    this.checkStockExistence(this.stockData.ticker);
    this.checkStockInWatchlist();
  }

  clearMessage() {
    this.message = '';
    this.watchlistService.clearMessage();
  }

  ngOnDestroy() {
    // Clear the interval on component destroy
    clearInterval(this.priceUpdateInterval);
  }

  openBuyModal() {
    this.buyModalComponent.open();
  }

  openSellModal() {
    this.sellModalComponent.open();
  }

  checkStockExistence(ticker: string) {
    this.portfolioService.checkStockExists(ticker).subscribe({
      next: (response) => {
        this.stockExists = response.exists;
      },
      error: (error) => {
        console.error('Error checking stock existence', error);
      }
    });
  }

  checkStockInWatchlist() {
    // Assuming getWatchlist() returns an observable of watchlist items
    this.watchlistService.getWatchlist().subscribe(watchlist => {
      this.isStockInWatchlist = watchlist.some(stock => stock.ticker === this.stockData.ticker);
    });
  }

  // private loadFromLocalStorage() {
  //   const savedStockData = localStorage.getItem('stockData');
  //   const savedPriceData = localStorage.getItem('priceData');
    
  //   if (savedStockData) {
  //     this.stockData = JSON.parse(savedStockData);
  //   }
  //   if (savedPriceData) {
  //     this.priceData = JSON.parse(savedPriceData);
  //     this.calculateroundoff(); // Ensure this method updates the display based on the loaded price data
  //   }
  // }
}
