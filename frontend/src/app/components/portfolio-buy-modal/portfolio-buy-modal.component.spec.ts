import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortfolioBuyModalComponent } from './portfolio-buy-modal.component';

describe('PortfolioBuyModalComponent', () => {
  let component: PortfolioBuyModalComponent;
  let fixture: ComponentFixture<PortfolioBuyModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PortfolioBuyModalComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PortfolioBuyModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
