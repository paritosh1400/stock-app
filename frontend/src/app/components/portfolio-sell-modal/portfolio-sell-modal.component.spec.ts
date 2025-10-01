import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioSellModalComponent } from './portfolio-sell-modal.component';

describe('PortfolioSellModalComponent', () => {
  let component: PortfolioSellModalComponent;
  let fixture: ComponentFixture<PortfolioSellModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortfolioSellModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PortfolioSellModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
