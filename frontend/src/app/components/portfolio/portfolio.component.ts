import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { PortfolioService } from '../../portfolio.service';
import { BackendService } from '../../backend.service';
import { PortfolioBuyModalComponent } from '../portfolio-buy-modal/portfolio-buy-modal.component';
import { PortfolioSellModalComponent } from '../portfolio-sell-modal/portfolio-sell-modal.component';
import { WatchlistService } from '../../watchlist.service';
import { Watch } from '@angular/core/primitives/signals';
import { Router } from '@angular/router';



@Component({
  selector: 'app-portfolio',
  templateUrl: './portfolio.component.html',
  styleUrl: './portfolio.component.css'
})
export class PortfolioComponent implements OnInit{
  walletAmount: number = 0;
  portfolioItems: any[] = [];
  isLoading: boolean = true;
  currentpricec: number = 0;
  currentticker: string = '';
  message = '';
  showMessage: boolean = false;
  

  @ViewChild(PortfolioBuyModalComponent) PortBuyModal!: PortfolioBuyModalComponent;
  @ViewChild(PortfolioSellModalComponent) PortSellModal!: PortfolioSellModalComponent;

  constructor(private portfolioService: PortfolioService,
              private watchlistService: WatchlistService,
              private router: Router,
              private backService: BackendService) {}

  ngOnInit() {
    this.message = '';
    this.portfolioService.currentWallet.subscribe(amount => this.walletAmount = amount);

    this.isLoading = true;

    this.portfolioService.currentMessage$.subscribe(message => {
      if (message) {
        this.message = message;
        this.showMessage = true;
        setTimeout(() => {
          this.closeMessage();
          }, 5000);
      }
    });

    // this.portfolioService.getPortfolio().subscribe((data: any) => {
    //   this.portfolioItems = data as any[];
    //   this.isLoading = false;
    // }, error => {
    //   console.error('error fetching portfolio', error)
    //   this.isLoading = false;
    // });
    this.refreshPortfolio();
    this.portfolioService.currentPrice$.subscribe(([ticker, price]) => {
      this.currentticker = ticker;
      this.currentpricec = price;
    });
  }

  navigateToSearch(ticker: string) {
    this.watchlistService.triggerSearch(ticker);
    this.router.navigate(['/search', ticker]);
    this.closeMessage();
  }

  updateWallet(newAmount: number) {
    this.portfolioService.updateWallet(newAmount);
  }

  openPortBuyModal(ticker: string, name: string, price: number) {
    this.PortBuyModal.ticker = ticker;
    this.PortBuyModal.name = name;
    this.PortBuyModal.price = price;
    this.PortBuyModal.openModal();
  }

  openPortSellModal(ticker: string, name: string, price: number){
    this.PortSellModal.ticker = ticker;
    this.PortSellModal.name = name;
    this.PortSellModal.price = price;
    this.PortSellModal.openModal();
  }

  refreshPortfolio() {
    this.isLoading = true; 
    let tickerPrices: [string, number][] = [];
    this.portfolioService.getTicker().subscribe({
      next: (tickers: any) => {
        console.log(tickers);

        Promise.all(tickers.map((ticker: any) => {
          return new Promise((resolve, reject) => {
            this.backService.searchPrice(ticker).subscribe({
              next: (currentPrice: any) => {
                tickerPrices.push([ticker, currentPrice.c]);
                resolve(currentPrice.c);
              }
            });
          });
        })).then(() => {
          console.log(tickerPrices);
          this.updatePortfolioPrices(tickerPrices);
        });
      }
    });
    this.portfolioService.getPortfolio().subscribe({
      next: (data: any) => {
        this.portfolioItems = data; // Update portfolio items with data from server
        this.isLoading = false; // Hide loading indicator
      },
      error: (error) => {
        console.error('Failed to fetch portfolio data', error);
        this.isLoading = false; // Hide loading indicator
        // Optionally, handle errors, e.g., by showing an error message to the user
      }
    });
  }

  updatePortfolioPrices(tickerPrices: [string, number][]) {
    this.portfolioService.updatepriceindb(tickerPrices).subscribe({
      next: () => {
        console.log('Portfolio prices updated');
      }
    });
  }

  closeMessage() {
    this.showMessage = false;
  } 

  ngOnDestroy () {
    this.portfolioService.resetCurrentMessage();
  }
}
