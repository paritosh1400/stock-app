import { Component, OnInit } from '@angular/core';
import { WatchlistService } from '../../watchlist.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-watchlist',
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit{
  watchlist: any[] = [];
  isLoading: boolean = true;
  
  constructor(private watchlistService: WatchlistService,
              private router: Router) {}

  // ngOnInit(): void {
  //   this.watchlistService.fetchAndUpdateWatchlistFromDb();
  //   this.watchlistService.currentWatchlist.subscribe(watchlist => {
  //     this.watchlist = watchlist;
  //   });
  // }

  ngOnInit(): void {
    this.watchlistService.fetchAndUpdateWatchlistFromDb().subscribe({
        next: (watchlist: any[]) => { 
            this.watchlist = watchlist;
            this.isLoading = false;
        },
        error: (error: any) => { 
            console.error('Error fetching watchlist from the database', error);
            this.isLoading = false;
        }
    });
  }

  navigateToSearch(ticker: string) {
    this.watchlistService.triggerSearch(ticker);
    this.router.navigate(['/search', ticker]);
  }
  
  removeStock(ticker: string, event: MouseEvent) {
    event.stopPropagation();
    this.watchlistService.removeFromWatchlist(ticker).subscribe({
      next: () => {
        // Fetch the updated watchlist from the database after removal
        this.watchlistService.fetchAndUpdateWatchlistFromDb().subscribe({
          next: (watchlist: any[]) => {
            this.watchlist = watchlist;
            console.log(`Stock with ticker ${ticker} removed from watchlist`);
          },
          error: error => {
            console.error('Error fetching updated watchlist after removal', error);
          }
        });
      },
      error: error => {
        console.error('Error removing stock from watchlist', error);
      }
    });
  }
  
}

