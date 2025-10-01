import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { PortfolioService } from '../../portfolio.service';

@Component({
  selector: 'app-buy-modal',
  templateUrl: './buy-modal.component.html',
  styleUrl: './buy-modal.component.css'
})
export class BuyModalComponent implements OnInit{
  @Input() pricec!: number;
  @Input() ticker!: string;
  @Input() name!: string;
  showModal: boolean = false;
  wallet: number = 0;
  quantity: number = 0;
  @Output() purchaseSuccess = new EventEmitter<string>();

  constructor(private portfolioService: PortfolioService ) {}


  ngOnInit(): void {
    this.portfolioService.currentWallet.subscribe(wallet => this.wallet = wallet);
  }

  buyStock() {
    const purchaseAmount = this.calculateTotal();
    if (purchaseAmount !== null && purchaseAmount <= this.wallet){
      this.portfolioService.buyStock(this.ticker, this.name, this.pricec, this.quantity, purchaseAmount).subscribe({
        next: () => {
          console.log("Added to database");
          this.close();
          this.purchaseSuccess.emit(`${this.ticker} bought successfully`);
        },
        error: (error) => {
          console.error('Purchase failed', error);
        }
      });
    } else {
      console.error('not enough funds', Error);
    }
  }

  open() {
    this.showModal = true;
 }

  close() {
    this.showModal = false;
  }

  calculateTotal(): number | null {
    const total = this.quantity * this.pricec;
    return total > this.wallet ? null : total;
  }
}
