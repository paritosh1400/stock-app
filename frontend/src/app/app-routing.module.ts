import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { SearchFormComponent } from './components/search-form/search-form.component';
import { WatchlistComponent } from './components/watchlist/watchlist.component';
import { PortfolioComponent } from './components/portfolio/portfolio.component';


const routes: Routes = [
  { path: '', redirectTo: '/search', pathMatch: 'full' },
  { path: 'search/:ticker', component: SearchFormComponent },
  { path: 'search', component: SearchFormComponent },
  { path: 'watchlist', component: WatchlistComponent },
  { path: 'portfolio', component: PortfolioComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
