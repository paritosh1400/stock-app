import { Component, Input, OnInit, OnChanges, Output, EventEmitter, SimpleChanges, PLATFORM_ID } from '@angular/core';
import { BackendService } from '../../backend.service';
import * as Highcharts from 'highcharts';
import { Observable, forkJoin, of} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import HC_exporting from 'highcharts/modules/exporting';
import HC_indicators from 'highcharts/indicators/indicators'; 
import HC_vbp from 'highcharts/indicators/volume-by-price'; 
import HC_candlestick from 'highcharts/modules/stock';
import { Inject} from '@angular/core'
import { isPlatformBrowser, isPlatformServer } from '@angular/common';
declare var bootstrap: any;

@Component({
  selector: 'app-tabdetails',
  templateUrl: './tabdetails.component.html',
  styleUrl: './tabdetails.component.css'
})
export class TabdetailsComponent implements OnChanges {
  constructor(private backService: BackendService, @Inject(PLATFORM_ID) private platformId: Object, private router: Router) {
    if(isPlatformBrowser(this.platformId)){
      HC_exporting(Highcharts);
      HC_indicators(Highcharts);
      HC_vbp(Highcharts);
      HC_candlestick(Highcharts);
    }
  }

  @Input() stockData: any;
  @Input() priceData: any;
  @Input() ticker: any;
  @Input() marketClosed: boolean = false;
  peerData: any;
  newsData: any[] = [];
  trendsData: any[] = [];
  sentData: any;
  earnData: any;
  histData: any;
  hourData: any;
  @Output() peerSelected: EventEmitter<string> = new EventEmitter<string>();
  selectedNewsItem: any = null;

  totalMspr: number = 0;
  positiveMspr: number = 0;
  negativeMspr: number = 0;
  totalChange: number = 0;
  positiveChange: number = 0;
  negativeChange: number = 0;

  activeTab: string = 'summary';

  isHighcharts = typeof Highcharts === 'object';
  chartConstructor: string = 'chart';
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions!: Highcharts.Options;
  histepschartOptions!: Highcharts.Options;
  comp1Options!: Highcharts.Options;
  HourOptions!: Highcharts.Options;

  isLoading: boolean = false;

  //For handling peers
  onPeerClick(peerSymbol: string): void {
    this.router.navigate(['/search', peerSymbol]);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['ticker'] && changes['ticker'].currentValue !== changes['ticker'].previousValue) {
      this.resetData();
      console.log("Data loaded again");
      this.loadData(this.ticker);
    }
  }

  //Sets the active tab
  setActiveTab(tabName: string) {
    this.activeTab = tabName;
  }

  //Opens news modal window
  openNewsModal(newsItem: any): void {
    this.selectedNewsItem = newsItem; 
    const newsModal = new bootstrap.Modal(document.getElementById('newsDetailModal'));
    newsModal.show();
  }

  //For MSPR Calculation
  calculateAggregates(): void {
    // Reset aggregates
    this.totalMspr = this.positiveMspr = this.negativeMspr = 0;
    this.totalChange = this.positiveChange = this.negativeChange = 0;

    this.sentData.data.forEach((item: any) => {
      // Aggregating mspr values
      this.totalMspr += item.mspr;
      if (item.mspr > 0) {
        this.positiveMspr += item.mspr;
      } else if (item.mspr < 0) {
        this.negativeMspr += item.mspr;
      }

      // Aggregating change values
      this.totalChange += item.change;
      if (item.change > 0) {
        this.positiveChange += item.change;
      } else if (item.change < 0) {
        this.negativeChange += item.change;
      }
    });
    this.totalMspr = parseFloat(this.totalMspr.toFixed(2));
    this.positiveMspr = parseFloat(this.positiveMspr.toFixed(2));
    this.negativeMspr = parseFloat(this.negativeMspr.toFixed(2));
  }

  //Reset the values of the variables for next search
  resetData(): void {
    this.peerData = null;
    this.newsData = [];
    this.trendsData = [];
    this.sentData = null;
    this.earnData = null;
    this.histData = null;
  }

  //Load the data 
  loadData(ticker: any): void {
    if (!ticker) return;

    this.isLoading = true;
    
    forkJoin({
      peerData: this.fetchPeerData(ticker),
      newsData: this.fetchNewsData(ticker),
      trendsData: this.fetchTrendsData(ticker),
      sentData: this.fetchSentData(ticker),
      earnData: this.fetchEarnData(ticker),
      histData: this.fetchHistData(ticker),
      hourData: this.fetchHourData(ticker)
    }).subscribe({
      next: (results) => {
        this.peerData = results.peerData as any[]; 
        this.newsData = (results.newsData as any[]).filter(item => item.image).slice(0, 20);
        this.trendsData = results.trendsData as any[]; 
        this.sentData = results.sentData as any; 
        this.earnData = results.earnData as any; 
        this.histData = results.histData as any;
        this.hourData = results.hourData as any;

        //Call Highcharts creation
        this.calculateAggregates();

        this.updateHighCharts1(this.trendsData);
        this.updateHighCharts2(this.earnData);
        this.updateHighCharts3(this.histData);
        this.updateHighCharts4(this.hourData);

        
        this.backService.dataLoaded.emit(true);
      },
      error: (error) => {
        console.error('An error occurred:', error);
        this.isLoading = false;
      }
    });

  }

  //Gets Peers
  fetchPeerData(ticker: any) {
    // this.backService.searchPeer(ticker).subscribe(peerdata=>{
    //   this.peerData = peerdata;
    // });
    return this.backService.searchPeer(ticker).pipe(
      catchError(error => {
          console.error('Error fetching peer data:', error);
          return of([]);
      })
    );
  }

  //Gets company historical data
  fetchHistData(ticker: any) {
    return this.backService.searchHist(ticker).pipe(
      catchError(error => {
        console.error('Error fetching hist data:', error);
        return of([]); 
      })
    );
  }

  //Gets company Hourly data
  fetchHourData(ticker: any) {
    return this.backService.searchHour(ticker).pipe(
      catchError(error => {
        console.error('Error fetching hour data:', error);
        return of ([]);
      })
    )
  }

  //Gets News
  fetchNewsData(ticker: any) {
    // this.backService.searchNews(ticker).subscribe(newsdata=>{
    //   this.newsData = (newsdata as any[]).filter(item => item.image).slice(0, 20);
    // });
    return this.backService.searchNews(ticker).pipe(
      catchError(error => {
          console.error('Error fetching news data:', error);
          return of([]); 
      })
    );
  }

  //Gets Recommendation Trends
  fetchTrendsData(ticker: any) {
    // this.backService.searchTrends(ticker).subscribe(trendsdata=>{
    //   this.trendsData = trendsdata as any[];
    // });
    return this.backService.searchTrends(ticker).pipe(
      catchError(error => {
          console.error('Error fetching trends data:', error);
          return of([]); 
      })
    )
  }

  //Gets insider sentiment
  fetchSentData(ticker: any) {
    // this.backService.searchSent(ticker).subscribe(sentdata=>{
    //       this.sentData = sentdata as any[];
    //       this.calculateAggregates();
    // });
    return this.backService.searchSent(ticker).pipe(
      catchError(error => {
          console.error('Error fetching sentiment data:', error);
          return of([]); 
      })
   );
  }

//   //Gets compnay Earning
  fetchEarnData(ticker: any) {
    // this.backService.searchEarn(this.ticker).subscribe(earndata=>{
    //       this.earnData = earndata;
    //       console.log(earndata);
    return this.backService.searchEarn(ticker).pipe(
      catchError(error => {
          console.error('Error fetching earnings data:', error);
          return of([]); 
      })
    );
  }

  //Chart for recommendation trends
  updateHighCharts1(trendsData: any []): void{
    this.chartOptions = {
          chart: {
            type: 'column',
            backgroundColor: '#f0f0f0'
          },
          title: {
            text: 'Recommendation Trends',
            align: 'center'
          },
          xAxis: {
            categories: [this.trendsData[0].period, this.trendsData[1].period, 
                        this.trendsData[2].period, this.trendsData[3].period]
          },
          yAxis: {
              min: 0,
              title: {
                  text: '#Analysis'
                },
              stackLabels: {
                  enabled: true
                }
          },
          tooltip: {
            headerFormat: '<b>{point.x}</b><br/>',
            pointFormat: '{series.name}: {point.y}<br/>Total: {point.stackTotal}'
          },
          plotOptions: {
              column: {
                  stacking: 'normal',
                  dataLabels: {
                      enabled: true
                  }
              }
          },
          series: [{
              name: 'Strong Buy',
              data: [this.trendsData[0].strongBuy, this.trendsData[1].strongBuy, this.trendsData[2].strongBuy,
                      this.trendsData[3].strongBuy],
              color: '#004d00'
            }, {
              name: 'Buy',
              data: [this.trendsData[0].buy, this.trendsData[1].buy, this.trendsData[2].buy,
                      this.trendsData[3].buy],
              color: '#00cc00'
            }, {
              name: 'Hold',
              data: [this.trendsData[0].hold, this.trendsData[1].hold, this.trendsData[2].hold,
                      this.trendsData[3].hold],
              color: '#cc9900'
            }, {
              name: 'Sell',
              data: [this.trendsData[0].sell, this.trendsData[1].sell, this.trendsData[2].sell,
                      this.trendsData[3].sell],
              color: '#ff6666'
            }, {
              name: 'Strong Sell',
              data: [this.trendsData[0].strongSell, this.trendsData[1].strongSell, this.trendsData[2].strongSell,
                      this.trendsData[3].strongSell],
              color: '#660000'
            }] as any[]
        }
  }

  //Charts for Company Earning
  updateHighCharts2(earnData: any[]): void {
    this.histepschartOptions = {
              chart: {
                type: 'spline',
                backgroundColor: '#f0f0f0'
              },
              title: {
                text: 'Historical EPS Surprises',
                align: 'center'
              },
              xAxis: {
                  reversed: false,
                  title: {
                    
                  },
                  categories: [
                    this.earnData[0].period + '<br>Surprise: ' + this.earnData[0].surprise,
                    this.earnData[1].period + '<br>Surprise: ' + this.earnData[1].surprise,
                    this.earnData[2].period + '<br>Surprise: ' + this.earnData[2].surprise,
                    this.earnData[3].period + '<br>Surprise: ' + this.earnData[3].surprise,
                  ],
                  showLastLabel: true
              },
              yAxis: {
                  title: {
                      text: 'Quaterly EPS'
                  },
                  labels: {
                      format: '{value}'
                  },
                  lineWidth: 2
              },
              legend: {
                enabled: true
              },
              tooltip: {
                  headerFormat: '<b>{series.name}</b><br/>',
                  pointFormat: 'Quaterly EPS: {point.y}'
              },
              plotOptions: {
                  spline: {
                      marker: {
                        enabled: true
                      }
                }
              },
              series: [{
                  type: 'spline',
                  name: 'Actual',
                  data: [this.earnData[0].actual, this.earnData[1].actual, this.earnData[2].actual, this.earnData[3].actual]
              },{
                  type: 'spline',
                  name: 'Estimate',
                  data: [this.earnData[0].estimate, this.earnData[1].estimate, this.earnData[2].estimate, this.earnData[3].estimate]
              }] as Highcharts.SeriesOptionsType[]
            }
  }
  
  //Charts for compnay historical data
  updateHighCharts3(histData: any[]): void {
    const ohlc = [],
        volume = [],
        dataLength = this.histData.results.length;

    for (let i = 0; i < dataLength; i += 1) {
        ohlc.push([
            this.histData.results[i].t, // the date
            this.histData.results[i].o, // open
            this.histData.results[i].h, // high
            this.histData.results[i].l, // low
            this.histData.results[i].c // close
        ]);

        volume.push([
            this.histData.results[i].t, // the date
            this.histData.results[i].v, // the volume
        ]);
    }

    this.comp1Options = {

      title: {
        text: this.ticker + ' Historical'
      },

      subtitle: {
        text: 'With SMA and Volume by Price technical indicators'
      },

      navigator: {
        enabled: true
      },

      chart: {
        height: '100%'
      },

      stockTools: {
        gui: {
          enabled: true,
          buttons: ['rangeSelector', 'datepicker']
        }
      },

      xAxis: {
        type: 'datetime',
        range: 6 * 30 * 24 * 3600 * 1000
      },

      yAxis: [{
          startOnTick: false,
          endOnTick: false,
          labels: {
            align: 'right',
            x: -3
          },
          title: {
            text: 'OHLC'
          },
          height: '60%',
          lineWidth: 2,
          resize: {
              enabled: true
          }
          }, {
          labels: {
              align: 'right',
              x: -3
          },
          title: {
              text: 'Volume'
          },
          top: '65%',
          height: '35%',
          offset: 0,
          lineWidth: 2
      }],

      tooltip: {
        split: true
      },

      rangeSelector: {
        selected: 0,
        enabled: true,
        inputEnabled: true,
        buttons: [
          {
            type: 'month',
            count: 1,
            text: '1m'
          },
          {
            type: 'month',
            count: 3,
            text: '3m'
          },
          {
            type: 'month',
            count: 6,
            text: '6m'
          },
          {
            type: 'ytd',
            text: 'YTD'
          },
          {
            type: 'all',
            text: 'All'
          }
        ]
      },

      series: [{
        type: 'candlestick',
        name: this.ticker,
        id: "OHLC",
        zIndex: 2,
        pointWidth: 5,
        data: ohlc
        }, {
        type: 'column',
        name: 'Volume',
        id: 'volume',
        data: volume,
        yAxis: 1
      },
      {
        type: 'vbp',
        linkedTo: "OHLC",
        params: {
          volumeSeriesID: 'volume'
        },
        dataLabels: {
          enabled: false
        },
        zoneLines: {
          enabled: false
        }
      },{
        type: 'sma',
        linkedTo: "OHLC",
        zIndex: 1,
        marker: {
          enabled: false
        }
      }
    ]
    }

  }

  //Charts for Company hourly data
  updateHighCharts4(hourData: any[]): void {

    const hdata = [],
          length = this.hourData.results.length;
    const ticker = this.ticker;

    for(let i = 0; i < length; i += 1) {
      hdata.push([
        this.hourData.results[i].t,
        this.hourData.results[i].c
      ]);
    }
    
    this.HourOptions = {
      chart: {
        backgroundColor: '#f3f3f3'
      },
      title: {
        text: this.ticker +' Hourly Price Variation',
        align: 'center'
      },
      xAxis: {
        type: 'datetime',
      },
      yAxis: {
        title: {
          text: ''
        },
        opposite: true,
      },
      series: [{
        data: hdata,
        showInLegend: false,
        marker: {
          enabled: false
        },
        color: this.marketClosed ? 'red' : 'green',
      }] as Highcharts.SeriesOptionsType[],
      tooltip: {
        formatter: function() {
          return `${ticker}: ${this.y}`
        }
      }
    }
  }
}


