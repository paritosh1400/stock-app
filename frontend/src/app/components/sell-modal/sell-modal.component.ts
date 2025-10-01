import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { PortfolioService } from '../../portfolio.service';

@Component({
  selector: 'app-sell-modal',
  templateUrl: './sell-modal.component.html',
  styleUrl: './sell-modal.component.css'
})
export class SellModalComponent implements OnInit {
  @Input() ticker!: string;
  @Input() pricec!: number;
  @Input() name!: string;
  showModal: boolean = false;
  wallet: number = 0;
  quantityOwned: number = 0;
  quantity: number = 0;
  @Output() saleSuccess = new EventEmitter<string>();

  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.portfolioService.currentWallet.subscribe(wallet => this.wallet = wallet);
  }

  open() {
    this.showModal = true;
    this.fetchStockQuantity();
  }

  close() {
    this.showModal = false;
  }

  fetchStockQuantity() {
    this.portfolioService.getStockQuantity(this.ticker).subscribe({
      next: (response) => {
        this.quantityOwned = response.quantity;
      },
      error: (error) => {
        console.error('Error fetching stock quantity', error);
        this.quantityOwned = 0; // Handle error or set a default value
      }
    });
  }

  calculatesellTotal(): number | null {
    const total = this.quantity * this.pricec;
    return total;
  }

  sellStock() {
    if (this.quantity > this.quantityOwned) {
      console.error('Attempting to sell more stocks than owned');
      // Optionally, display an error message to the user
      return;
    }
  
    this.portfolioService.sellStock(this.ticker, this.pricec, this.quantity).subscribe({
      next: () => {
        console.log("Stock sold successfully");
        this.saleSuccess.emit(`${this.ticker} sold successfully`);
        // Update UI accordingly, maybe close the modal and refresh the portfolio list
        this.close();
      },
      error: (error) => {
        console.error('Error selling stock:', error);
        // Optionally, display an error message to the user
      }
    });
  }
    
}


