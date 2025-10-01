import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { PortfolioService } from '../../portfolio.service';

@Component({
  selector: 'app-portfolio-buy-modal',
  templateUrl: './portfolio-buy-modal.component.html',
  styleUrl: './portfolio-buy-modal.component.css'
})
export class PortfolioBuyModalComponent {
  @Input() ticker: string = '';
  @Input() name: string = '';
  @Input() price: number = 0;

  showModal: boolean = false;
  wallet: number = 0;
  quantity: number = 0;

  @Output() transactionCompleted = new EventEmitter<void>();

  constructor(private portfolioService: PortfolioService ) {}

  ngOnInit(): void {
    this.portfolioService.currentWallet.subscribe(wallet => this.wallet = wallet);
  }

  buyStock() {
    const purchaseAmount = this.calculateTotal();
    if (purchaseAmount !== null && purchaseAmount <= this.wallet){
      this.portfolioService.buyStock(this.ticker, this.name, this.price, this.quantity, purchaseAmount).subscribe({
        next: () => {
          console.log("Added to database")
          const message = `${this.ticker} stock bought successfully`;
          this.portfolioService.updateMessage(message);
          this.transactionCompleted.emit();
          this.closeModal();
        },
        error: (error) => {
          console.error('Purchase failed', error);
        }
      });
    } else {
      console.error('not enough funds', Error);
    }
  }

  openModal() {
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  calculateTotal(): number | null {
    const total = this.quantity * this.price;
    return total > this.wallet ? null : total;
  }
}
