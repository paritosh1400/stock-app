import { NgModule } from '@angular/core';
import { BrowserModule, provideClientHydration } from '@angular/platform-browser';

//
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
//
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HeaderComponent } from './components/header/header.component';
import { SearchFormComponent } from './components/search-form/search-form.component'; 

import { BackendService } from './backend.service';
import { StockDisplayComponent } from './components/stock-display/stock-display.component';
import { TabdetailsComponent } from './components/tabdetails/tabdetails.component';
import { CustomDateFormatPipe } from './pipes/date-format.pipe';
import { HighchartsChartModule } from 'highcharts-angular';
import { FooterComponent } from './components/footer/footer.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { RouterModule, Routes } from '@angular/router';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';
import { BuyModalComponent } from './components/buy-modal/buy-modal.component';
import { SellModalComponent } from './components/sell-modal/sell-modal.component';
import { PortfolioBuyModalComponent } from './components/portfolio-buy-modal/portfolio-buy-modal.component';
import { PortfolioSellModalComponent } from './components/portfolio-sell-modal/portfolio-sell-modal.component';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs'


@NgModule({
  declarations: [
    AppComponent,
    HeaderComponent,
    SearchFormComponent,
    StockDisplayComponent,
    TabdetailsComponent,
    CustomDateFormatPipe,
    FooterComponent,
    WatchlistComponent,
    PortfolioComponent,
    BuyModalComponent,
    SellModalComponent,
    PortfolioBuyModalComponent,
    PortfolioSellModalComponent,
  ],
  imports: [
    BrowserModule,
    NgbModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule,
    AppRoutingModule,
    HighchartsChartModule,
    MatAutocompleteModule,
    MatProgressSpinnerModule,
    MatTabsModule
  ],
  providers: [
    provideClientHydration(),
    BackendService,
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
