import { Component, Input, EventEmitter, Output } from '@angular/core';
import { PortfolioService } from '../../portfolio.service';

@Component({
  selector: 'app-portfolio-sell-modal',
  templateUrl: './portfolio-sell-modal.component.html',
  styleUrl: './portfolio-sell-modal.component.css'
})
export class PortfolioSellModalComponent {
  @Input() ticker: string = '';
  @Input() name: string = '';
  @Input() price: number = 0;
  showModal: boolean = false;
  wallet: number = 0;
  quantityOwned: number = 0;
  quantity: number = 0;

  @Output() transactionCompleted = new EventEmitter<void>();
  
  constructor(private portfolioService: PortfolioService) {}

  ngOnInit(): void {
    this.portfolioService.currentWallet.subscribe(wallet => this.wallet = wallet);
  }

  openModal() {
    this.showModal = true;
    this.fetchStockQuantity();
  }

  closeModal() {
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
    const total = this.quantity * this.price;
    return total;
  }

  sellStock() {
    if (this.quantity > this.quantityOwned) {
      console.error('Attempting to sell more stocks than owned');
      // Optionally, display an error message to the user
      return;
    }
  
    this.portfolioService.sellStock(this.ticker, this.price, this.quantity).subscribe({
      next: () => {
        console.log("Stock sold successfully");
        const successMessage = `${this.ticker} stock sold successfully`;
        this.portfolioService.updateMessage(successMessage);
        this.transactionCompleted.emit();
        // Update UI accordingly, maybe close the modal and refresh the portfolio list
        this.closeModal();
      },
      error: (error) => {
        console.error('Error selling stock:', error);
        // Optionally, display an error message to the user
      }
    });
  }
}
