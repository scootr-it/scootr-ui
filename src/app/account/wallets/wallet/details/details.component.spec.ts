import { ComponentFixture, TestBed } from '@angular/core/testing';

import { WalletDetailsComponent } from './details.component';

describe('WalletDetailsComponent', () => {
  let component: WalletDetailsComponent;
  let fixture: ComponentFixture<WalletDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ WalletDetailsComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(WalletDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
