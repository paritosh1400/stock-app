import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TabdetailsComponent } from './tabdetails.component';

describe('TabdetailsComponent', () => {
  let component: TabdetailsComponent;
  let fixture: ComponentFixture<TabdetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [TabdetailsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TabdetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
