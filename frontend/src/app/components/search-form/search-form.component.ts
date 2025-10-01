import { Component, OnInit, ViewChild, Inject } from '@angular/core';
import { BackendService } from '../../backend.service';
import { WatchlistService } from '../../watchlist.service';
import { NgForm, FormControl } from '@angular/forms'; 
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { of, Subject } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';

@Component({
  selector: 'app-search-form',
  templateUrl: './search-form.component.html',
  styleUrl: './search-form.component.css'
})
export class SearchFormComponent implements OnInit {
  constructor(private backService: BackendService,
              private watchlistService: WatchlistService,
              private route: ActivatedRoute,
              private router: Router) {}

  ticker: any;
  stockTicker: string = '';
  stockResult: any;
  searchResults: any[] = [];
  priceResult: any;
  showError: boolean=false;
  errorMessage: string = '';
  @ViewChild('searchform') searchform!: NgForm;
  isLoading: boolean = false;
  showAutocomplete: boolean = false;

  //Change
  symbols: any;
  filteredSymbols: any[] = [];

  private searchSubject: Subject<string> = new Subject<string>();
  
  ngOnInit(): void {

    this.backService.currentTicker$.subscribe(ticker => {
      if (ticker) {
        this.stockTicker = ticker;
      }
    });

    this.backService.currentSearchResult$.subscribe(result => {
      if (result) {
        this.stockResult = result;
      }
    });

    this.backService.currentPriceResult$.subscribe(price => {
      if (price) {
        this.priceResult = price;
      }
    });

    this.route.params.subscribe(params => {
      const ticker = params['ticker'];
      if (ticker) {
        this.stockTicker = ticker; 
        this.onSubmit({ stockTicker: ticker }); 
      }
    });

    this.searchSubject.pipe(
      debounceTime(1000), // Wait for 1 second after user stops typing
      switchMap((query: string) => {
        return this.backService.getautocomplete(query).pipe(
          catchError(error => {
            console.error('Error fetching autocomplete:', error);
            return of([]); // Return empty array in case of error
          })
        );
      })
    ).subscribe((results: any[]) => {
      this.searchResults = results.map(result => `${result.displaySymbol} | ${result.description}`);
      this.showAutocomplete = true;
    });
  }

  onInputChange(event: any): void {
    // Clear previous results
    this.searchResults = [];

    this.showAutocomplete = true;

    // Emit the input value to the searchSubject
    this.searchSubject.next(event.target.value);
  }

  onOptionSelected(event: MatAutocompleteSelectedEvent): void {
      // Get the selected option value
    const selectedValue = event.option.value;

    // Split the selected string at '|'
    const splitValues = selectedValue.split('|');

    // Get the first value after splitting
    const firstValue = splitValues[0].trim();
    this.searchform.value.stockTicker = firstValue

    this.onSubmit(this.searchform.value);
  }

  clearForm() {
    // Reset form fields
    this.ticker = '';
    this.stockTicker = '';
    this.isLoading = false;
    this.showError = false;
    this.errorMessage = '';
    this.stockResult = null;
    this.priceResult = null;
    this.searchResults = [];
    this.showAutocomplete = false;

    this.backService.updateTicker('');
    this.backService.updateSearchResult(null);
    this.backService.updatePriceResult(null);

    this.router.navigate(['/search']);
  }

  selectResult(event: any): void {
    // Handle selection logic here
    console.log("Selected:", event.option.value);
    this.showAutocomplete = false;
    this.stockTicker = event.option.value; // Optionally, set the selected result to the input field
  }

  onPeerChanged(newTicker: string): void {
    // if (this.searchform && this.searchform.controls['stockTicker']) {
    //   this.searchform.controls['stockTicker'].setValue(newTicker);
    //   console.log("Peer changed");
    //   this.onSubmit({ stockTicker: newTicker });
    // }
    // this.router.navigate(['/search', newTicker]);
    console.log(newTicker)
  }

  onSubmit(formValue: any): void{

    this.stockResult = null;
    this.priceResult = null;
    this.showError = false;
    this.isLoading = true;
    
    this.backService.searchStock(formValue.stockTicker).subscribe({
      next: (stockdata) => {
        if (Object.keys(stockdata).length === 0) {
          this.showError = true;
          this.errorMessage = "No data found. Please enter a valid Ticker";
          this.isLoading = false; // Stop loading since there's an error
        } else {
          this.stockResult = stockdata;
          this.backService.updateSearchResult(stockdata);


        // Fetch price data only if stock data is successfully retrieved
          this.backService.searchPrice(formValue.stockTicker).subscribe({
            next: (pricedata) => {
              this.priceResult = pricedata;
              this.backService.updatePriceResult(pricedata);
              this.isLoading = false; // Data loaded successfully
              // if (isPlatformBrowser(this.platformId)) {
              //   this.saveToLocalStorage();
              // }

            },
            error: () => {
              this.showError = true;
              this.errorMessage = "Failed to load price data.";
              this.isLoading = false; // Stop loading due to error
            }
          });
        
          this.backService.updateTicker(formValue.stockTicker);
        }
      },
      error: () => {
        this.showError = true;
        this.errorMessage = "Failed to load stock data.";
        this.isLoading = false; // Stop loading due to error
      }
    });
    this.watchlistService.clearMessage();
    this.router.navigate(['/search', formValue.stockTicker]);
  }
}
